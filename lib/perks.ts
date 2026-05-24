import fs from 'fs';
import path from 'path';

export interface PartnerProgram {
  programName: string;
  brands: string;
  notes: string;
  officialLink: string;
  topSearchResults: string;
  partnerLink: string;
}

// Global cached programs
let cachedPrograms: PartnerProgram[] | null = null;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function loadPartnerPrograms(): PartnerProgram[] {
  if (cachedPrograms) return cachedPrograms;

  try {
    const csvPath = path.join(process.cwd(), 'partner programs.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at ${csvPath}`);
      return [];
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    const programs: PartnerProgram[] = [];

    // Parse lines, skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      if (fields.length >= 6) {
        programs.push({
          programName: fields[0].trim(),
          brands: fields[1].trim(),
          notes: fields[2].trim(),
          officialLink: fields[3].trim(),
          topSearchResults: fields[4].trim(),
          partnerLink: fields[5].trim(),
        });
      }
    }

    cachedPrograms = programs;
    return programs;
  } catch (error) {
    console.error('Error loading partner programs CSV:', error);
    return [];
  }
}

export function getPartnerProgramForHotel(hotelName: string, brand?: string): PartnerProgram | null {
  const programs = loadPartnerPrograms();
  if (programs.length === 0) return null;

  const cleanName = (hotelName || '').toLowerCase().trim();
  const cleanBrand = (brand || '').toLowerCase().trim();

  // Find Virtuoso for fallback
  const virtuosoProgram = programs.find(p => p.programName.toLowerCase() === 'virtuoso') || null;

  // Filter out Virtuoso from specific brand matching
  const specificPrograms = programs.filter(p => p.programName.toLowerCase() !== 'virtuoso');

  for (const program of specificPrograms) {
    // Split program brands by comma
    const programBrands = program.brands.split(',').map(b => b.trim().toLowerCase()).filter(b => b.length > 0);

    for (const progBrand of programBrands) {
      // Check for exact/contained match with hotel brand
      if (cleanBrand && cleanBrand !== 'independent' && cleanBrand !== 'independent hotel') {
        if (cleanBrand === progBrand || cleanBrand.includes(progBrand) || progBrand.includes(cleanBrand)) {
          return program;
        }
      }
      
      // Check if hotel name contains the program brand as a word or substring
      if (cleanName.includes(progBrand)) {
        return program;
      }
    }
  }

  // Fallback to Virtuoso
  return virtuosoProgram;
}
