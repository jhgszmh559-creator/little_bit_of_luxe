import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load .env.local variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface PartnerProgram {
  programName: string;
  brands: string;
  notes: string;
  officialLink: string;
  referenceLinks: string;
  partnerLink: string;
}

// 100% correct state-machine CSV parser that handles quotes, commas, and escaped quotes
function parseCSV(content: string): PartnerProgram[] {
  const records: string[][] = [];
  let currentField = '';
  let currentRecord: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      // Look ahead for escaped quotes (double double-quotes)
      if (i + 1 < content.length && content[i + 1] === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++; // skip \n
      }
      currentRecord.push(currentField);
      records.push(currentRecord);
      currentRecord = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField || currentRecord.length > 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  if (records.length === 0) return [];
  
  // Clean headers
  const headers = records[0].map(h => h.trim().toLowerCase());
  const results: PartnerProgram[] = [];

  for (let i = 1; i < records.length; i++) {
    const record = records[i];
    if (record.length === 0 || (record.length === 1 && !record[0])) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = record[index] ? record[index].trim() : '';
    });

    results.push({
      programName: row['program name'] || '',
      brands: row['brands'] || '',
      notes: row['notes'] || '',
      officialLink: row['official link'] || row['official link '] || '',
      referenceLinks: row['top search results for reference'] || '',
      partnerLink: row['link to partner'] || '',
    });
  }

  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getLoyaltyNetwork(brands: string, programName: string): string {
  const lowerBrands = brands.toLowerCase();
  const lowerProgram = programName.toLowerCase();
  if (lowerBrands.includes('hilton') || lowerProgram.includes('hilton')) return 'Hilton';
  if (lowerBrands.includes('marriott') || lowerBrands.includes('ritz') || lowerBrands.includes('st. regis') || lowerBrands.includes('st regis') || lowerProgram.includes('marriott')) return 'Marriott';
  if (lowerBrands.includes('hyatt') || lowerBrands.includes('andaz') || lowerBrands.includes('alila') || lowerProgram.includes('hyatt')) return 'Hyatt';
  if (lowerBrands.includes('accor') || lowerBrands.includes('orient express') || lowerBrands.includes('fairmont') || lowerBrands.includes('raffles') || lowerProgram.includes('accor') || lowerProgram.includes('hera')) return 'Accor';
  if (lowerBrands.includes('ihg') || lowerBrands.includes('intercontinental') || lowerBrands.includes('six senses') || lowerBrands.includes('regent') || lowerProgram.includes('ihg')) return 'IHG';
  return 'Independent';
}

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
];

async function main() {
  console.log('--- Starting Content Bootstrapping Script (Anthropic Claude API - Custom model: claude-sonnet-4-6) ---');
  
  const csvPath = path.resolve(process.cwd(), 'partner programs.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('Error: CSV file not found at', csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const programs = parseCSV(csvContent);
  console.log(`Parsed ${programs.length} programs from CSV.`);

  const outputDir = path.resolve(process.cwd(), 'content/programs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const forceRegenerate = process.env.FORCE_REGENERATE === 'true';

  for (let idx = 0; idx < programs.length; idx++) {
    const program = programs[idx];
    if (!program.programName) continue;
    const slug = slugify(program.programName);
    const outputPath = path.join(outputDir, `${slug}.md`);

    // To allow refreshing existing articles with updated tone and formatting
    if (fs.existsSync(outputPath) && !forceRegenerate) {
      console.log(`Skipping: Article for "${program.programName}" already exists at ${outputPath}`);
      continue;
    }

    console.log(`Generating article for "${program.programName}"...`);
    const loyaltyNetwork = getLoyaltyNetwork(program.brands, program.programName);
    const coverImage = UNSPLASH_IMAGES[idx % UNSPLASH_IMAGES.length];

    try {
      const systemPrompt = `You are a Principal Luxury Travel Editorial Director for "Little Bit of Luxe", a highly refined digital travel journal.
Your voice is deeply considered, slow, quiet, trusted, and architectural. Think Cereal Magazine or Departures.
Writing style guidelines:
- Never use exclamation marks (!) or emojis.
- Headlines should be 4 to 10 words, with EXACTLY one evocative word italicized inside single asterisks, e.g. The quiet art of *belonging* or The luxury of going *slowly*. Do NOT wrap the entire headline in outer asterisks or double asterisks.
- Sentences are balanced, graceful, and carry weight. Use em-dashes (—) with spaces where appropriate for structural pauses.
- Avoid all hype, deals-blog speak ("game-changing", "ultimate", "unbelievable", "insane deals", "must-book", "unveils", "unlocks", "elevate"). Focus on design, heritage, sense of place, and quiet elegance. The voice should be elevated, but down-to-earth, natural and human. Nobody talks like marketing copy.
- Use first-person plural ("our editors", "we", "our choice") to represent the journal.
- Return ONLY the raw content for a markdown file including YAML frontmatter. Do not wrap the response in markdown blocks (\`\`\`markdown ... \`\`\` or \`\`\`html ... \`\`\`).`;

      const userPrompt = `Write an exquisite, comprehensive luxury editorial article about the preferred partner program: "${program.programName}".
Here is the data we have for it:
- Program Name: ${program.programName}
- Loyalty Network/Owner: ${loyaltyNetwork}
- Brands participating: ${program.brands}
- Key benefits and operational notes: ${program.notes}
- Official Website: ${program.officialLink}
- Booking/Partner URL: ${program.partnerLink}

You MUST follow this exact structure for the output:
1. YAML frontmatter at the very top enclosed in "---":
title: "[Creative Headline, 4-10 words, matching brand rules with exactly one word wrapped in single asterisks]"
excerpt: "[One elegant, poetic, serif italic dek sentence setting the scene]"
programName: "${program.programName}"
loyaltyNetwork: "${loyaltyNetwork}"
brands: "${program.brands}"
officialLink: "${program.officialLink}"
partnerLink: "${program.partnerLink}"
date: "${new Date().toISOString().split('T')[0]}"
category: "Preferred Partner"
draft: false
image: "${coverImage}"

2. Markdown body starting with the Creative Headline (H1) which contains exactly one italicized word inside single asterisks, matching the title in the frontmatter. E.g.
# The quiet art of *belonging*

3. A dek paragraph (H2 styled as serif italic). E.g.
## An editorial reflection on ${program.programName}, where travel is stripped of pretense and returned to its architectural and cultural roots.

4. Full prose body (3-4 extensive, gorgeous, descriptive paragraphs). Do not use bullet points or lists for prose. Ensure the writing style is elevated but down-to-earth, describing the experience, heritage, design, and perks of the program.

5. A signature Call-to-Action (CTA) block. Use this exact HTML structure for the CTA banner so the frontend renders it as a stunning on-brand block:
<div className="my-12 p-8 bg-midnight text-sand border-none">
  <p className="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p>
  <h3 className="lbl-h3 text-sand mb-4">Book ${program.programName} Perks *Carefully*</h3>
  <p className="lbl-body text-sand/85 mb-6">
    Through our preferred partnership, we unlock complimentary breakfast, room upgrades, and $100 property credits — matching the best flexible rates available directly, with all your standard loyalty nights and points fully recognized.
  </p>
  <a href="${program.partnerLink}" target="_blank" rel="noopener noreferrer" className="btn--subscribe">
    Book with Perks <span className="arrow">→</span>
  </a>
</div>

6. "The Verdict" box at the end. Use this exact HTML structure:
<div className="verdict-box">
  <div>
    <span className="verdict-eyebrow">The Verdict</span>
    <h3 className="verdict-title">A considered way to *travel*</h3>
    <div className="verdict-rows mt-6">
      <div className="verdict-row">
        <span className="verdict-row-key">Program</span>
        <span className="verdict-row-val">${program.programName}</span>
      </div>
      <div className="verdict-row">
        <span className="verdict-row-key">Best For</span>
        <span className="verdict-row-val">Guaranteed elite-tier benefits without prepaying</span>
      </div>
      <div className="verdict-row">
        <span className="verdict-row-key">Highlight</span>
        <span className="verdict-row-val">Priority room upgrades and full loyalty credits</span>
      </div>
    </div>
  </div>
  <div className="verdict-score-container">
    <span className="verdict-score">9.<em>8</em></span>
    <span className="verdict-denominator">/ 10</span>
  </div>
</div>`;

      // Helper sleep function
      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      let response;
      let retries = 5;
      let delay = 15000; // wait 15 seconds if we hit 429
      
      while (retries > 0) {
        try {
          response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4000,
            temperature: 0.3,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          });
          break;
        } catch (error: any) {
          if (error?.status === 429 || error?.message?.includes('429') || error?.toString().includes('rate_limit')) {
            console.warn(`Rate limit hit (429). Retrying in ${delay / 1000}s. Retries remaining: ${retries - 1}`);
            await sleep(delay);
            retries--;
            delay = Math.min(delay * 1.5, 60000); // Backoff up to 60s
          } else {
            throw error;
          }
        }
      }

      if (!response || !response.content || !response.content[0] || response.content[0].type !== 'text') {
        throw new Error(`Failed to generate content after retries.`);
      }

      let content = response.content[0].text;

      // Clean up markdown block wraps if returned
      if (content.startsWith('```markdown')) {
        content = content.replace(/^```markdown\n/, '').replace(/\n```$/, '');
      } else if (content.startsWith('```html')) {
        content = content.replace(/^```html\n/, '').replace(/\n```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      fs.writeFileSync(outputPath, content.trim(), 'utf-8');
      console.log(`Successfully bootstrapped: ${slug}.md`);
      
      // Cool-off period to avoid hitting the rate limit
      await sleep(1500);
    } catch (error) {
      console.error(`Failed to generate article for "${program.programName}":`, error);
    }
  }

  console.log('--- Content Bootstrapping Complete ---');
}

main().catch(err => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
