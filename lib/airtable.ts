interface AirtableHotel {
  name: string;
  program: string;
  benefits: string;
}

let cachedHotels: AirtableHotel[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600000; // 1 hour in ms

/**
 * Fetches the list of hotels and their partner program details from Airtable.
 * Supports flexible column naming, API pagination, and robust caching/fallback.
 */
export async function getAirtableHotels(): Promise<AirtableHotel[]> {
  const now = Date.now();
  if (cachedHotels && (now - cacheTime < CACHE_TTL)) {
    return cachedHotels;
  }

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!token || !baseId || !tableName) {
    // Graceful fallback for local development or when credentials are not supplied
    return [];
  }

  const hotels: AirtableHotel[] = [];
  let offset: string | undefined = undefined;

  try {
    do {
      let url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=100`;
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
        
        // Flexible column mapping: resolve hotel name, program name, and privileges list
        const name = fields['Hotel Name'] || fields['Property Name'] || fields['Name'] || fields['hotelName'] || '';
        const program = fields['Partner Program'] || fields['Program'] || fields['program'] || '';
        const benefits = fields['Benefits'] || fields['Privileges'] || fields['benefits'] || fields['perks'] || '';

        if (name) {
          hotels.push({
            name: String(name).trim(),
            program: String(program).trim(),
            benefits: String(benefits).trim(),
          });
        }
      }

      offset = data.offset;
    } while (offset);

    cachedHotels = hotels;
    cacheTime = now;
    return hotels;
  } catch (err) {
    console.error("Error fetching hotels from Airtable database:", err);
    // Fall back to stale cache if available, or an empty list to prevent runtime crashes
    return cachedHotels || [];
  }
}
