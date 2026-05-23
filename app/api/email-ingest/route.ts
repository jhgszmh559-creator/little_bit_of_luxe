import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveContentToGithub } from '@/lib/github';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-admin-secret') || request.headers.get('X-Admin-Secret');
    const adminSecret = process.env.ADMIN_SECRET || 'luxe2026';
    if (!secret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return NextResponse.json({ error: "GITHUB_ACCESS_TOKEN is not configured. Please add it to your platform deployment environment variables." }, { status: 500 });
    }
    const data = await request.json();
    const { subject = '', body = '', from = '' } = data;

    if (!body && !subject) {
      return NextResponse.json({ error: 'Empty email payload body and subject' }, { status: 400 });
    }

    console.log(`Received email webhook ingestion. From: ${from}, Subject: ${subject}`);

    // Step 1: Gemini - Analyze email content & extract target hotel details
    const extractModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const extractionPrompt = `You are an editorial assistant. Analyze this luxury travel email newsletter and extract the primary hotel property details.
    
    Email Subject: ${subject}
    Email Body:
    ${body}
    
    Extract the following details as raw text:
    - Target Hotel Name (The primary property highlighted or reviewed)
    - Brand (e.g. Aman, Belmond, Rosewood, Hyatt, Marriott, Hilton, Accor, IHG, Independent)
    - Location (City, Country)
    - Key takeaways (atmosphere, design, standout feature)
    - Actionable pricing or booking notes if mentioned`;

    const extractResult = await extractModel.generateContent(extractionPrompt);
    const extractedInfo = extractResult.response.text();
    console.log('Email parsing entity extraction completed:', extractedInfo);

    // Parse tentative hotel name
    let hotelName = '';
    const nameMatch = extractedInfo.match(/Hotel Name:\s*(.*)/i);
    if (nameMatch && nameMatch[1].trim()) {
      hotelName = nameMatch[1].trim();
    } else {
      // Fallback extraction
      const lines = extractedInfo.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('hotel') || line.toLowerCase().includes('resort')) {
          hotelName = line.replace(/[-*#]/g, '').trim();
          break;
        }
      }
    }

    if (!hotelName || hotelName.toLowerCase() === 'luxury retreat') {
      // Fallback to email subject if no hotel name is found
      hotelName = subject.replace(/fwd:|fw:|re:/gi, '').trim();
    }

    // Step 2: Perplexity Sonar search for background info to ensure factual correctness
    let searchContext = '';
    let citations: string[] = [];
    if (process.env.PERPLEXITY_API_KEY && hotelName) {
      try {
        console.log(`Querying Perplexity Sonar for details on email entity: ${hotelName}...`);
        const pepResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar-reasoning-pro',
            messages: [
              { 
                role: 'system', 
                content: 'Provide detailed, factual, and verified real-time info about hotel properties including architecture, designer, room configurations, location, and highlights.' 
              },
              { 
                role: 'user', 
                content: `Retrieve verified facts about the luxury hotel: "${hotelName}". Focus on designer details, unique suite layouts, precise location, and key brand alignments.` 
              }
            ],
            max_tokens: 800
          })
        });

        if (pepResponse.ok) {
          const pepData = await pepResponse.json();
          searchContext = pepData.choices?.[0]?.message?.content || '';
          citations = pepData.citations || [];
        }
      } catch (err) {
        console.error('Failed to query Perplexity during email-ingest:', err);
      }
    }

    // Step 3: Draft editorial hotel news opening markdown using Gemini 3.5 Flash
    const draftModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const citationsStr = JSON.stringify(citations);

    const draftPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe".
    Write a gorgeous, 800-word magazine-style hotel news opening announcement/coverage draft for: "${hotelName}".
    
    Use the following gathered intel:
    ---
    EMAIL INTELLIGENCE:
    ${extractedInfo}
    
    SEARCH CONTEXT:
    ${searchContext}
    ---
    
    Writing Guidelines:
    - Never use exclamation marks (!) or emojis.
    - Title should be 4 to 10 words, with EXACTLY one evocative word italicized and bolded inside * ** ** *, e.g. *The quiet rebirth of a historic **Lisbon** icon*.
    - Set the tone with a single poetic serif italic dek sentence beneath the H1.
    - Use em-dashes (—) for structural pauses. Maintain a quiet, trusted, architectural tone.
    - Focus heavily on heritage, design details, tactile materials, and sense of place.
    - Write 4-5 extensive, flowing, gorgeous prose paragraphs.
    
    - Output should include a YAML frontmatter block at the very top:
    ---
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    date: "${new Date().toISOString()}"
    category: "Hotel News"
    draft: true
    status: "draft"
    sources: ${citationsStr}
    brand: "[Extracted Hotel Brand, e.g. Belmond or Independent]"
    property_name: "${hotelName}"
    location: "[Extracted City, Country]"
    projected_opening: "[Projected Opening, e.g. Opening late 2026 or Now Open]"
    early_newsletter_cta: true
    source_url: "${citations[0] || ''}"
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;

    const draftResult = await draftModel.generateContent(draftPrompt);
    let draftContent = draftResult.response.text();

    // Clean wraps
    if (draftContent.startsWith('```markdown')) {
      draftContent = draftContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (draftContent.startsWith('```')) {
      draftContent = draftContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Save draft to content/news/
    const slug = slugify(hotelName);
    const relPath = `content/news/${slug}.md`;
    await saveContentToGithub(relPath, draftContent.trim(), `Email Ingest: ${slug}`);

    console.log(`Successfully parsed email and saved news draft at: ${relPath}`);

    return NextResponse.json({
      success: true,
      hotelName,
      slug,
      path: relPath,
      intel: {
        extractedInfo,
        searchContext
      }
    });

  } catch (error: any) {
    console.error('Fatal error in email-ingest:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
