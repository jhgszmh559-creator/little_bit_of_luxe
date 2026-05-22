import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export async function POST(request: NextRequest) {
  try {
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
          console.log('Perplexity Sonar details retrieved successfully.');
        } else {
          console.warn('Perplexity request failed with status:', pepResponse.status);
        }
      } catch (err) {
        console.error('Failed to connect to Perplexity:', err);
      }
    }

    // Step 3: Claude/Gemini Drafting - Generate the structured, editorial, on-brand article
    const draftingModel = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const draftPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe".
    Write a gorgeous, 800-word magazine-style review draft for: "${hotelName}".
    
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
    - Write 4-5 extensive, flowing, gorgeous prose paragraphs.
    - Inject a signature QX Perks CTA block using this EXACT HTML:
      <div className="my-12 p-8 bg-midnight text-sand border-none">
        <p className="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p>
        <h3 className="lbl-h3 text-sand mb-4">Book ${hotelName} with Perks</h3>
        <p className="lbl-body text-sand/85 mb-6">
          Through our preferred partnership, we unlock daily breakfast, priority upgrades, and property credits — matching the best flexible rates available directly, with all your standard loyalty nights and points fully recognized.
        </p>
        <a href="https://www.qxtravel.io/search-hotels" target="_blank" rel="noopener noreferrer" className="btn--subscribe">
          Book with Perks <span className="arrow">→</span>
        </a>
      </div>
    
    - Output should include a YAML frontmatter block at the very top:
    ---
    title: "[Creative Headline, 4-10 words]"
    excerpt: "[Poetic serif dek sentence]"
    hotelName: "${hotelName}"
    brand: "[Extracted Hotel Brand, e.g. Rosewood or Independent]"
    location: "[Extracted City, Country]"
    rating: 9.2
    roomType: "[Typical Room/Suite Category]"
    youtubeId: ""
    showQxPerks: true
    date: "${new Date().toISOString().split('T')[0]}"
    category: "Hotel Review"
    draft: true
    ogImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;

    const draftResult = await draftingModel.generateContent(draftPrompt);
    let draftContent = draftResult.response.text();

    // Clean markdown wrap wraps if any
    if (draftContent.startsWith('```markdown')) {
      draftContent = draftContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (draftContent.startsWith('```')) {
      draftContent = draftContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Save draft directly to content/reviews/
    const slug = slugify(hotelName);
    const reviewsDir = path.join(process.cwd(), 'content', 'reviews');
    if (!fs.existsSync(reviewsDir)) {
      fs.mkdirSync(reviewsDir, { recursive: true });
    }
    const outputPath = path.join(reviewsDir, `${slug}.md`);
    fs.writeFileSync(outputPath, draftContent.trim(), 'utf-8');

    console.log(`Successfully ingested and saved news-ingest review draft at: ${outputPath}`);

    return NextResponse.json({
      success: true,
      hotelName,
      slug,
      path: outputPath,
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
