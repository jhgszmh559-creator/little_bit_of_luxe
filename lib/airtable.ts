export interface AirtableHotel {
  name: string;
  benefits?: string;
}

export interface AirtableProgram {
  name: string;
  slug: string;
  benefits: string;
}

// Map website program slugs to Airtable program slugs where they differ
export const PROGRAM_SLUG_MAP: Record<string, string> = {
  'accor-preferred-by-hera': 'accor-preferred',
  'belmond-bellini-club': 'bellini-club',
  'couture-by-langham': 'couture',
  'dorchester-diamond-club': 'diamond-club',
  'jumeirah-passport-to-luxury': 'passport-to-luxury',
  'kempinski-club-1897': 'club-1897-kempinski',
  'mandarin-oriental-fan-club': 'fan-club',
  'oetker-pearl-partner': 'pearl-partner',
  'preferred-platinum': 'preferred-platinum-partner',
  'relais-chateau-preferred-partner': 'relais-chateux',
  'rocco-forte-knights': 'sir-roccos-knights',
  'shangri-la-luxury-circle': 'the-luxury-circle',
  'within-by-slh': 'small-luxury-hotels-within',
};

// Cache structures for programs and hotels
const programCache: Record<string, { data: AirtableProgram | null; expiry: number }> = {};
const hotelsCache: Record<string, { data: AirtableHotel[]; expiry: number }> = {};
const CACHE_TTL = 3600000; // 1 hour in ms

/**
 * Fetches program details (like benefits) from Airtable for a specific program slug.
 */
export async function getAirtableProgram(airtableSlug: string): Promise<AirtableProgram | null> {
  const now = Date.now();
  if (programCache[airtableSlug] && (now < programCache[airtableSlug].expiry)) {
    return programCache[airtableSlug].data;
  }

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'partner_program';

  if (!token || !baseId) {
    return null;
  }

  try {
    const formula = `{Slug} = '${airtableSlug}'`;
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Airtable API response error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json() as {
      records: { id: string; fields: Record<string, any> }[];
    };

    if (!data.records || data.records.length === 0) {
      programCache[airtableSlug] = { data: null, expiry: now + CACHE_TTL };
      return null;
    }

    const fields = data.records[0].fields;
    const program: AirtableProgram = {
      name: fields['Name'] || '',
      slug: fields['Slug'] || '',
      benefits: fields['Program benefits'] || fields['benefits'] || '',
    };

    programCache[airtableSlug] = { data: program, expiry: now + CACHE_TTL };
    return program;
  } catch (err) {
    console.error(`Error fetching program from Airtable for slug ${airtableSlug}:`, err);
    return null;
  }
}

/**
 * Fetches the list of hotels belonging to a specific program from Airtable.
 */
export async function getAirtableHotelsForProgram(airtableSlug: string): Promise<AirtableHotel[]> {
  const now = Date.now();
  if (hotelsCache[airtableSlug] && (now < hotelsCache[airtableSlug].expiry)) {
    return hotelsCache[airtableSlug].data;
  }

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!token || !baseId) {
    return [];
  }

  const hotels: AirtableHotel[] = [];
  let offset: string | undefined = undefined;

  try {
    do {
      const formula = `FIND('${airtableSlug}', {Main special program} & '')`;
      let url = `https://api.airtable.com/v0/${baseId}/Hotels?filterByFormula=${encodeURIComponent(formula)}&maxRecords=100`;
      if (offset) {
        url += `&offset=${encodeURIComponent(offset)}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        throw new Error(`Airtable API response error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json() as {
        records: { id: string; fields: Record<string, any> }[];
        offset?: string;
      };

      for (const record of data.records) {
        const fields = record.fields;
        const name = fields['Name'] || fields['Hotel Name'] || '';
        const benefits = fields['Preferred benefits'] || fields['benefits'] || '';

        if (name) {
          hotels.push({
            name: String(name).trim(),
            benefits: String(benefits).trim(),
          });
        }
      }

      offset = data.offset;
    } while (offset);

    hotelsCache[airtableSlug] = { data: hotels, expiry: now + CACHE_TTL };
    return hotels;
  } catch (err) {
    console.error(`Error fetching hotels from Airtable for program ${airtableSlug}:`, err);
    return [];
  }
}
