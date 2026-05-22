import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { saveContentToGithub } from '@/lib/github';

export const dynamic = 'force-dynamic';

// Helper to slugify a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return NextResponse.json({ error: "GITHUB_ACCESS_TOKEN is not configured. Please add it to your platform deployment environment variables." }, { status: 500 });
    }

    const { type, name, notes } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Missing required fields: type and name' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ error: 'Perplexity API key is not configured' }, { status: 500 });
    }

    // Enforce Perplexity Sonar search as absolute first action step
    let searchResults = '';
    let citations: string[] = [];
    try {
      const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant. Provide detailed fact sheets, opening dates, brand ownership, structural data, and recent press reports for the requested hotel asset.'
            },
            {
              role: 'user',
              content: `Research the hotel/property asset: "${name}". Focus on live asset modifications, opening dates, location, brand networks, key designers, and global press records.`
            }
          ]
        }),
      });

      if (!perplexityRes.ok) {
        const errText = await perplexityRes.text();
        throw new Error(`Perplexity API error: ${perplexityRes.status} ${errText}`);
      }

      const perplexityData = await perplexityRes.json();
      searchResults = perplexityData.choices?.[0]?.message?.content || '';
      citations = perplexityData.citations || [];
      if (!searchResults.trim()) {
        throw new Error('Perplexity returned empty research results');
      }
    } catch (searchError: any) {
      console.error('Perplexity search failed:', searchError);
      return NextResponse.json({ error: `Perplexity research failed: ${searchError.message || searchError}` }, { status: 500 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key is not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert editorial writer for "Little bit of LUXE", a premium luxury travel publication. 
Your writing style is elevated but down-to-earth. Avoid cliches, generic superlatives, or overly corporate marketing jargon. Write with architectural focus, sensory details, and authentic narrative depth.
Ensure markdown formatting is perfectly clean:
- Use italics like *this* for emphasis or styling.
- Do NOT combine italics and bold in ways that look buggy (e.g., avoid "*word***").
- Use ONLY '###' for sub-section headings in the content. Do NOT use '##' or '#' for subheaders.
- Do NOT use placeholders. Generate fully completed, high-quality copy.

You must output your response in raw JSON format with no additional text or conversational wrapper. The JSON must contain:
1. "title": A poetic, editorial title.
2. "excerpt": A single poetic, structured description sentence (meta description).
3. "content": The body copy in markdown, featuring several paragraphs and '###' headers.
4. "metadata": An object containing fields specific to the layout type.

For layout type "review":
metadata should contain:
- "hotel_name": string
- "brand": string
- "location": string
- "rating": number (between 8.0 and 10.0, e.g., 9.5)
- "room_type": string (e.g., "Alcova Palazzo Chamber")
- "youtube_id": string (optional, e.g., "dQw4w9WgXcQ")
- "show_qx_perks": boolean (default true)
- "meta_title": string
- "meta_description": string

For layout type "news":
metadata should contain:
- "brand": string
- "property_name": string
- "location": string
- "projected_opening": string (e.g., "Opening Spring 2027")
- "early_newsletter_cta": boolean (default true)
- "source_url": string (optional website URL)

For layout type "program":
metadata should contain:
- "program_name": string
- "loyalty_network": string
- "brands": string (comma-separated list of participating brands)
- "official_link": string
- "partner_link": string
- "verdict": an object with "best_for", "highlight", and "score" (a string rating out of 10)`;

    const userPrompt = `Generate a travel ${type} article about "${name}".
Additional prompt guidelines/notes: ${notes || 'None provided.'}

Here is the real-time research context retrieved from Perplexity Sonar for "${name}" (use these live details to formulate the article content, avoid blind generation or hallucination):
${searchResults}

Please return the response as a single valid JSON object following the format constraints exactly.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Clean up response if wrapped in markdown code blocks
    let jsonString = responseText.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    let articleData;
    try {
      articleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', responseText);
      return NextResponse.json({ error: 'Claude returned invalid JSON', raw: responseText }, { status: 500 });
    }

    const { title, excerpt, content, metadata } = articleData;
    const slug = slugify(name);

    // Save generated content to file
    let subfolder = 'programs';
    if (type === 'review') {
      subfolder = 'reviews';
    } else if (type === 'news') {
      subfolder = 'news';
    }

    const relPath = `content/${subfolder}/${slug}.md`;

    // Prepare frontmatter
    const frontmatter: Record<string, any> = {
      title: title || name,
      excerpt: excerpt || '',
      date: new Date().toISOString(),
      category: type === 'program' ? 'Preferred Partner' : type === 'news' ? 'Hotel News' : 'Hotel Review',
      draft: true,
      status: 'draft',
      sources: citations,
    };

    if (type === 'program') {
      frontmatter.programName = metadata?.program_name || name;
      frontmatter.loyaltyNetwork = metadata?.loyalty_network || 'Independent';
      frontmatter.brands = metadata?.brands || '';
      frontmatter.officialLink = metadata?.official_link || '';
      frontmatter.partnerLink = metadata?.partner_link || '';
      frontmatter.image = '';
      if (metadata?.verdict) {
        frontmatter.verdict = {
          best_for: metadata.verdict.best_for || '',
          highlight: metadata.verdict.highlight || '',
          score: metadata.verdict.score || '9.0',
        };
      }
    } else if (type === 'news') {
      frontmatter.brand = metadata?.brand || '';
      frontmatter.property_name = metadata?.property_name || name;
      frontmatter.location = metadata?.location || '';
      frontmatter.projected_opening = metadata?.projected_opening || '';
      frontmatter.early_newsletter_cta = metadata?.early_newsletter_cta !== false;
      frontmatter.source_url = metadata?.source_url || '';
      frontmatter.image = '';
    } else {
      frontmatter.hotelName = metadata?.hotel_name || name;
      frontmatter.brand = metadata?.brand || '';
      frontmatter.location = metadata?.location || '';
      frontmatter.rating = Number(metadata?.rating) || 9.5;
      frontmatter.roomType = metadata?.room_type || '';
      frontmatter.youtubeId = metadata?.youtube_id || '';
      frontmatter.showQxPerks = metadata?.show_qx_perks !== false;
      frontmatter.metaTitle = metadata?.meta_title || '';
      frontmatter.metaDescription = metadata?.meta_description || '';
      frontmatter.ogImage = '';
    }

    // Serialize frontmatter
    const yamlLines = ['---'];
    Object.entries(frontmatter).forEach(([key, val]) => {
      if (typeof val === 'string') {
        const cleanVal = val.replace(/"/g, '\\"');
        yamlLines.push(`${key}: "${cleanVal}"`);
      } else if (Array.isArray(val)) {
        yamlLines.push(`${key}:`);
        val.forEach((item) => {
          const cleanItem = String(item).replace(/"/g, '\\"');
          yamlLines.push(`  - "${cleanItem}"`);
        });
      } else if (typeof val === 'object' && val !== null) {
        yamlLines.push(`${key}:`);
        Object.entries(val).forEach(([subKey, subVal]) => {
          const cleanSubVal = String(subVal).replace(/"/g, '\\"');
          yamlLines.push(`  ${subKey}: "${cleanSubVal}"`);
        });
      } else {
        yamlLines.push(`${key}: ${val}`);
      }
    });
    yamlLines.push('---');
    yamlLines.push('');

    const fileContents = `${yamlLines.join('\n')}\n${content.trim()}`;
    await saveContentToGithub(relPath, fileContents, `Generate ${type}: ${slug}`);

    return NextResponse.json({
      success: true,
      slug,
      filePath: relPath,
      article: {
        title,
        excerpt,
        content,
        frontmatter,
      }
    });
  } catch (error: any) {
    console.error('Error generating article:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
