import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveContentToGithub } from '@/lib/github';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const maxDuration = 60; // Allow enough time for Perplexity + Gemini generation

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate with ADMIN_SECRET
    const secret = request.headers.get('x-admin-secret') || 
                   request.headers.get('X-Admin-Secret') || 
                   request.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SECRET || 'luxe2026';
    if (!secret || secret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'GITHUB_ACCESS_TOKEN is not configured in environment variables' }, { status: 500 });
    }

    // 2. Parse incoming payload based on content type
    let textContent = '';
    let overrideType = '';
    let overrideName = '';
    let overrideInstructions = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        textContent = await file.text();
      } else {
        textContent = (formData.get('text') || formData.get('content') || formData.get('notes') || '') as string;
      }
      overrideType = (formData.get('type') || formData.get('articleType') || '') as string;
      overrideName = (formData.get('name') || formData.get('hotelName') || '') as string;
      overrideInstructions = (formData.get('instructions') || formData.get('customPrompt') || '') as string;
    } else if (contentType.includes('application/json')) {
      const data = await request.json();
      textContent = data.text || data.content || data.body || data.notes || '';
      overrideType = data.type || data.articleType || '';
      overrideName = data.name || data.hotelName || '';
      overrideInstructions = data.instructions || data.customPrompt || '';
    } else {
      // Fallback: Read raw body as plain text
      textContent = await request.text();
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
    }

    console.log(`Received text webhook ingestion. Character length: ${textContent.length}`);

    // 3. AI Entity Extraction (using Gemini JSON mode)
    const extractModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const extractionPrompt = `Analyze the following luxury travel text notes and extract key details:
    
    TEXT NOTES:
    ${textContent}
    
    Return a JSON object containing:
    {
      "hotelName": "string or empty",
      "brand": "string or empty",
      "location": "string or empty",
      "articleType": "news" | "review" | "program",
      "takeaways": "string summarizing key highlights"
    }
    
    If the text notes do not specify an article type, default to "news".`;

    let hotelName = overrideName;
    let brand = '';
    let location = '';
    let articleType = overrideType || 'news';
    let takeaways = '';

    try {
      const extractResult = await extractModel.generateContent(extractionPrompt);
      const resText = extractResult.response.text();
      const extracted = JSON.parse(resText);
      
      if (!hotelName) hotelName = extracted.hotelName || 'Luxury Retreat';
      brand = extracted.brand || 'Independent';
      location = extracted.location || 'Global';
      if (!overrideType) articleType = extracted.articleType || 'news';
      takeaways = extracted.takeaways || '';
    } catch (extractErr) {
      console.error('Gemini extraction failed, using defaults:', extractErr);
      if (!hotelName) hotelName = 'Luxury Retreat';
      brand = 'Independent';
      location = 'Global';
    }

    // Ensure the articleType is normalized
    if (articleType !== 'review' && articleType !== 'program') {
      articleType = 'news';
    }

    console.log(`Extracted metadata - Name: ${hotelName}, Brand: ${brand}, Location: ${location}, Type: ${articleType}`);

    // 4. Perplexity Sonar Background Research
    let perplexityContext = '';
    let citations: string[] = [];
    if (process.env.PERPLEXITY_API_KEY && hotelName && hotelName !== 'Luxury Retreat') {
      try {
        console.log(`Querying Perplexity Sonar for details on: ${hotelName}...`);
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
                content: 'Provide comprehensive factual details about luxury hotel properties including opening status, location, brand, designer, unique highlights, and official links.' 
              },
              { 
                role: 'user', 
                content: `Provide comprehensive factual details about the luxury hotel: "${hotelName}". Focus on exact opening status, location, architecture/designer highlights, unique suite offerings, and brand affiliations.` 
              }
            ],
            max_tokens: 1000
          })
        });

        if (pepResponse.ok) {
          const pepData = await pepResponse.json();
          perplexityContext = pepData.choices?.[0]?.message?.content || '';
          citations = pepData.citations || [];
          console.log(`Perplexity details retrieved. Citations: ${citations.length}`);
        } else {
          console.warn('Perplexity request failed with status:', pepResponse.status);
        }
      } catch (err) {
        console.error('Failed to query Perplexity:', err);
      }
    }

    // 5. Draft the Editorial Article
    let draftingModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const citationsStr = JSON.stringify(citations);
    const dateStr = new Date().toISOString();

    let draftPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe".
    Write a gorgeous, 800-word to 1000-word magazine-style article draft for: "${hotelName}".
    
    The layout type is: "${articleType}".
    
    Use the following gathered intel:
    ---
    INBOUND TEXT DETAILS:
    ${textContent}
    ${takeaways ? `EXTRACTED HIGHLIGHTS: ${takeaways}` : ''}
    
    SEARCH CONTEXT:
    ${perplexityContext}
    
    ${overrideInstructions ? `CUSTOM INSTRUCTIONS: ${overrideInstructions}` : ''}
    ---
    
    Writing Guidelines (Crucial for Brand alignment):
    - Never use exclamation marks (!) or emojis.
    - Title should be 4 to 10 words, with EXACTLY one evocative word italicized and bolded inside * ** ** *, e.g. *A slow return to the historic hills of **Fiesole***.
    - Set the tone with a single poetic serif italic dek sentence beneath the H1.
    - Use em-dashes (—) for structural pauses. Maintain a quiet, trusted, architectural tone.
    - Focus heavily on heritage, design details, tactile materials, and sense of place.
    - Use '##' (H2 headings) for all sub-section headings in the content (for the table of contents to parse). Do NOT use '###' or '#' for subheaders.
    - The target article length must be strictly between 800 and 1000 words.
    - Always include a "How to Book" section at the end under a '## How to Book' heading, highlighting QX Travel and the preferred partner benefits (such as complimentary daily breakfast, priority upgrades, property credits, etc.) depending on the brand/program.
    - Write 4-5 extensive, flowing, gorgeous prose paragraphs before the How to Book section.
    `;

    if (articleType === 'review') {
      draftPrompt += `
    - Output should include a YAML frontmatter block at the very top:
    ---
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    hotelName: "${hotelName}"
    brand: "${brand}"
    location: "${location}"
    rating: 9.0
    roomType: "Luxury Suite"
    showQxPerks: true
    date: "${dateStr}"
    draft: true
    status: "draft"
    sources: ${citationsStr}
    category: "Hotel Review"
    galleryStyle: "grid"
    verdictHead: "[A quiet editorial verdict summary heading]"
    verdictHighlight: "[Standout feature highlight]"
    verdictBestFor: "[The ideal traveler persona]"
    verdictScore: "9.0"
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;
    } else if (articleType === 'program') {
      draftPrompt += `
    - Output should include a YAML frontmatter block at the very top:
    ---
    layout: "program"
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    programName: "${hotelName}"
    loyaltyNetwork: "${brand}"
    brands: "${brand}"
    officialLink: ""
    partnerLink: ""
    date: "${dateStr}"
    category: "Preferred Partner"
    draft: true
    status: "draft"
    sources: ${citationsStr}
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;
    } else { // news
      draftPrompt += `
    - Output should include a YAML frontmatter block at the very top:
    ---
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    date: "${dateStr}"
    category: "Hotel News"
    draft: true
    status: "draft"
    sources: ${citationsStr}
    brand: "${brand}"
    property_name: "${hotelName}"
    location: "${location}"
    projected_opening: "Now Open"
    early_newsletter_cta: true
    source_url: "${citations[0] || ''}"
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;
    }

    let draftContent = '';
    try {
      const draftResult = await draftingModel.generateContent(draftPrompt);
      draftContent = draftResult.response.text();
    } catch (err: any) {
      console.warn('Gemini 2.5 Flash failed, trying gemini-1.5-pro...', err.message);
      draftingModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: { temperature: 0.3 }
      });
      const draftResult = await draftingModel.generateContent(draftPrompt);
      draftContent = draftResult.response.text();
    }

    // Clean wraps
    if (draftContent.startsWith('```markdown')) {
      draftContent = draftContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (draftContent.startsWith('```')) {
      draftContent = draftContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Save to GitHub
    const slug = slugify(hotelName);
    let subfolder = 'news';
    if (articleType === 'review') {
      subfolder = 'reviews';
    } else if (articleType === 'program') {
      subfolder = 'programs';
    }

    const relPath = `content/${subfolder}/${slug}.md`;
    await saveContentToGithub(relPath, draftContent.trim(), `Text Webhook Ingest (${articleType}): ${slug}`);

    // Save locally for instant development updates
    const localDir = path.join(process.cwd(), 'content', subfolder);
    try {
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      fs.writeFileSync(path.join(process.cwd(), relPath), draftContent.trim());
      console.log(`Saved locally at ${relPath}`);
    } catch (localWriteErr: any) {
      console.warn('Failed to save locally:', localWriteErr.message);
    }

    return NextResponse.json({
      success: true,
      hotelName,
      slug,
      path: relPath,
      articleType,
      title: hotelName
    });

  } catch (error: any) {
    console.error('Text webhook ingest error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
