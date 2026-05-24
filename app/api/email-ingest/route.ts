import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveContentToGithub } from '@/lib/github';
import Anthropic from '@anthropic-ai/sdk';
import { getPartnerProgramForHotel } from '@/lib/perks';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { validateArticle } from '@/lib/schemaValidator';

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

    // Step 3: Resolve partner program perks & Draft editorial hotel news opening markdown using Gemini 3.5 Flash
    const program = getPartnerProgramForHotel(hotelName);
    const programName = program ? program.programName : 'Virtuoso';
    const programNotes = program ? program.notes : 'Consortia for high end luxury travel agents. Prestige in the industry a large range of hotels & resorts, villas, cruises and experiences - rooms get US$100 one time credit, suites get US$200 one time credit and multi-bedroom residences get US$200 per bedroom. Breakfast benefit can be in the restaurant or in-room';
    const programPartnerLink = program ? program.partnerLink : 'https://www.qxtravel.io/search-hotels';

    const draftModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.3 }
    });

    const citationsStr = JSON.stringify(citations);

    const draftPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe".
    Write a gorgeous, 800-word to 1000-word magazine-style hotel news opening announcement/coverage draft for: "${hotelName}".
    
    PREFERRED PARTNER BOOKING INFO (Ground Truth - use these details for the "How to Book" section at the end of the article, do not hallucinate other details):
    - Preferred Program: ${programName}
    - Program Perks: ${programNotes}
    - QX Travel Booking URL: ${programPartnerLink}
    
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
    brand: "[Extracted Hotel Brand, e.g. Belmond or Independent]"
    property_name: "${hotelName}"
    location: "[Extracted City, Country]"
    projected_opening: "[Projected Opening, e.g. Opening late 2026 or Now Open]"
    early_newsletter_cta: true
    partnerLink: "${programPartnerLink}"
    showQxPerks: true
    source_url: "${citations[0] || ''}"
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
    ---
    
    Return ONLY the raw content for the markdown file. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\`).`;

    let draftContent = '';
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      try {
        console.log('Querying Claude (claude-sonnet-4-6) for email-ingested news article draft...');
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
      const draftResult = await draftModel.generateContent(draftPrompt);
      draftContent = draftResult.response.text();
    }

    // Clean wraps
    if (draftContent.startsWith('```markdown')) {
      draftContent = draftContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
    } else if (draftContent.startsWith('```')) {
      draftContent = draftContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const slug = slugify(hotelName);

    // Run validation on generated content
    let validation = { isValid: false, errors: [] as string[], warnings: [] as string[] };
    try {
      const { data: parsedData, content: parsedBody } = matter(draftContent);
      validation = validateArticle('news', { ...parsedData, slug }, parsedBody);
    } catch (parseErr) {
      validation.errors.push("Failed to parse YAML frontmatter block.");
    }

    if (!validation.isValid) {
      console.warn(`[Email Ingest] Ingest validation failed: ${validation.errors.join(', ')}. Attempting AI self-repair...`);
      try {
        const repairModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const repairPrompt = `You are a schema correction assistant for the luxury travel journal "Little Bit of Luxe".
The generated article markdown failed validation with these errors:
${validation.errors.map(e => `- ${e}`).join('\n')}

Please fix the YAML frontmatter format and content structure of the article below.
Rules:
1. Ensure the YAML frontmatter is at the top of the file, starting with --- and ending with ---.
2. The title must contain exactly one word or short phrase surrounded by single asterisks for italic style (e.g. *Aman* Venice).
3. Do not include Heading 1 (#) inside the body content. Only use H2 (##) or H3 (###).
4. Do not include markdown code block wraps (\`\`\`markdown ... \`\`\`) in your output. Return only the raw markdown text.

ORIGINAL CONTENT:
${draftContent}

Return the complete, repaired markdown file.`;

        const repairResult = await repairModel.generateContent(repairPrompt);
        let repairedContent = repairResult.response.text().trim();
        if (repairedContent.startsWith('```markdown')) {
          repairedContent = repairedContent.replace(/^```markdown\n/, '').replace(/\n```$/, '');
        } else if (repairedContent.startsWith('```')) {
          repairedContent = repairedContent.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // Re-validate repaired content
        const { data: repData, content: repBody } = matter(repairedContent);
        const repValidation = validateArticle('news', { ...repData, slug }, repBody);
        if (repValidation.isValid) {
          console.log('[Email Ingest] AI self-repair succeeded.');
          draftContent = repairedContent;
        } else {
          console.warn(`[Email Ingest] AI self-repair finished with remaining issues: ${repValidation.errors.join(', ')}. Saving draft with errors for manual editor fixing.`);
          draftContent = repairedContent;
        }
      } catch (repairErr: any) {
        console.error('[Email Ingest] AI self-repair failed:', repairErr.message || repairErr);
      }
    }

    // Save draft to content/news/
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
