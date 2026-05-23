import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveContentToGithub } from '@/lib/github';
import Anthropic from '@anthropic-ai/sdk';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const maxDuration = 300; // Extend to 5 minutes to prevent Perplexity + Gemini generation timeouts

export async function POST(request: NextRequest) {
  try {
    if (process.env.ADMIN_SECRET === undefined) {
      console.warn('Warning: process.env.ADMIN_SECRET is undefined on preview branch.');
    }
    const secret = request.headers.get('x-admin-secret') || request.headers.get('X-Admin-Secret');
    const adminSecret = process.env.ADMIN_SECRET || 'luxe2026';
    if (!secret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return NextResponse.json({ error: "GITHUB_ACCESS_TOKEN is not configured. Please add it to your platform deployment environment variables." }, { status: 500 });
    }
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const customPrompt = formData.get('instructions') as string || '';

    if (!imageFile) {
      return NextResponse.json({ error: 'No image attachment provided' }, { status: 400 });
    }

    // Convert file to base64 for Gemini Vision
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const mimeType = imageFile.type;

    console.log(`Received vision upload. Size: ${bytes.byteLength} bytes, Type: ${mimeType}`);

    // Step 1: Gemini Vision - Extract hotel details from image
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const visionPrompt = `Analyze this image (which contains details about a luxury hotel opening, review, or announcement). 
    Extract the following details in raw text:
    - Hotel Name
    - Brand/Network (e.g. Belmond, Rosewood, Aman, Four Seasons, Independent)
    - Location (City, Country)
    - Key Highlights mentioned in the screenshot
    - Expected Opening Date or Status
    Return a clean block of key-value text.`;

    const visionResult = await visionModel.generateContent([
      { text: visionPrompt },
      { inlineData: { data: base64Data, mimeType } }
    ]);
    const extractedInfo = visionResult.response.text();
    console.log('Gemini Vision extraction completed:', extractedInfo);

    // Parse out a tentative hotel name from the vision text
    let hotelName = 'Luxury Retreat';
    const hotelMatch = extractedInfo.match(/Hotel Name:\s*(.*)/i);
    if (hotelMatch && hotelMatch[1].trim()) {
      hotelName = hotelMatch[1].trim();
    } else {
      // Fallback: search for first line that looks like a title
      const lines = extractedInfo.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('hotel') || line.toLowerCase().includes('resort')) {
          hotelName = line.replace(/[-*#]/g, '').trim();
          break;
        }
      }
    }

    // Step 2: Perplexity Sonar - Retrieve real-time search context
    let perplexityContext = '';
    let citations: string[] = [];
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        console.log(`Querying Perplexity Sonar for details on: ${hotelName}...`);
        const pepResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar-reasoning-pro', // Sonar reasoning model
            messages: [
              { 
                role: 'system', 
                content: 'You are an elite research assistant. Provide exact, structured real-time facts about luxury hotel properties. Include opening details, designer, room counts, and signature amenities.' 
              },
              { 
                role: 'user', 
                content: `Provide comprehensive factual details about the luxury hotel: "${hotelName}". Search the web for its exact opening status, location, architecture/designer highlights, unique suite offerings, and direct official booking links.` 
              }
            ],
            max_tokens: 1000
          })
        });

        if (pepResponse.ok) {
          const pepData = await pepResponse.json();
          perplexityContext = pepData.choices?.[0]?.message?.content || '';
          citations = pepData.citations || [];
          console.log(`Perplexity Sonar details retrieved successfully. Citations: ${citations.length}`);
        } else {
          console.warn('Perplexity request failed with status:', pepResponse.status);
        }
      } catch (err) {
        console.error('Failed to connect to Perplexity:', err);
      }
    }

    // Step 3: Claude/Gemini Drafting - Generate the structured, editorial, on-brand article
    let draftingModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const citationsStr = JSON.stringify(citations);

    const draftPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe".
    Write a gorgeous, 800-word to 1000-word magazine-style hotel news opening announcement/coverage draft for: "${hotelName}".
    
    Use the following gathered raw intelligence:
    ---
    VISION INTELLIGENCE:
    ${extractedInfo}
    
    REAL-TIME SEARCH CONTEXT:
    ${perplexityContext}
    
    CUSTOM INSTRUCTIONS:
    ${customPrompt}
    ---
    
    Writing Guidelines (Crucial for Brand alignment):
    - Never use exclamation marks (!) or emojis.
    - Title should be 4 to 10 words, with EXACTLY one evocative word italicized and bolded inside * ** ** *, e.g. *A slow return to the historic hills of **Fiesole***.
    - Set the tone with a single poetic serif italic dek sentence beneath the H1.
    - Use em-dashes (—) for structural pauses. Maintain a quiet, trusted, architectural tone.
    - Focus heavily on heritage, design details, tactile materials, and sense of place.
    - Use '##' (H2 headings) for all sub-section headings in the content (for the table of contents to parse). Do NOT use '###' or '#' for subheaders.
    - The target article length must be strictly between 800 and 1000 words.
    - Always include a "How to Book" section at the end under a '## How to Book' heading, highlighting QX Travel and the preferred partner benefits (such as complimentary daily breakfast, priority upgrades, property credits, etc.) depending on the hotel brand or program network.
    - Write 4-5 extensive, flowing, gorgeous prose paragraphs before the How to Book section.
    
    - Output should include a YAML frontmatter block at the very top:
    ---
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    date: "${new Date().toISOString()}"
    category: "Hotel News"
    draft: true
    status: "draft"
    sources: ${citationsStr}
    brand: "[Extracted Hotel Brand, e.g. Rosewood or Independent]"
    property_name: "${hotelName}"
    location: "[Extracted City, Country]"
    projected_opening: "[Projected Opening, e.g. Opening late 2026 or Now Open]"
    early_newsletter_cta: true
    source_url: "${citations[0] || ''}"
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;

    let draftContent = '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        console.log('Querying Claude (claude-sonnet-4-6) for news article draft...');
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{ role: 'user', content: draftPrompt }],
        });
        draftContent = response.content[0].type === 'text' ? response.content[0].text : '';
      } catch (claudeErr: any) {
        console.error('Claude generation failed, falling back to Gemini:', claudeErr.message || claudeErr);
      }
    }

    if (!draftContent) {
      console.warn('Claude not available or failed. Falling back to Gemini...');
      let success = false;
      let attempts = 0;
      draftingModel = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { temperature: 0.3 }
      });
      while (attempts < 3 && !success) {
        try {
          const draftResult = await draftingModel.generateContent(draftPrompt);
          draftContent = draftResult.response.text();
          success = true;
        } catch (err: any) {
          attempts++;
          const status = err?.status || err?.response?.status;
          const msg = err?.message || '';
          if (status === 503 || status === 429 || msg.includes('503') || msg.includes('429')) {
            console.warn(`Gemini 2.5 Flash failed (Attempt ${attempts}). Retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            console.warn(`Gemini 2.5 Flash failed with non-retryable error: ${msg}`);
            break;
          }
        }
      }

      if (!success) {
        console.warn('Gemini 2.5 Flash failed completely. Failing over to gemini-1.5-pro...');
        draftingModel = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-pro',
          generationConfig: { temperature: 0.3 }
        });
        const draftResult = await draftingModel.generateContent(draftPrompt);
        draftContent = draftResult.response.text();
      }
    }

    // Clean markdown wrap wraps if any
    if (draftContent.startsWith('```markdown')) {
      draftContent = draftContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (draftContent.startsWith('```')) {
      draftContent = draftContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Save draft directly to content/news/
    const slug = slugify(hotelName);
    const relPath = `content/news/${slug}.md`;
    await saveContentToGithub(relPath, draftContent.trim(), `News Ingest: ${slug}`);

    console.log(`Successfully ingested and saved news-ingest news draft at: ${relPath}`);

    return NextResponse.json({
      success: true,
      hotelName,
      slug,
      path: relPath,
      intel: {
        extractedInfo,
        perplexityContext
      }
    });

  } catch (err: any) {
    console.error('Fatal error in news-ingest:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
