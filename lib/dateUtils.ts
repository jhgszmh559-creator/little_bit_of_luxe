export function formatPremiumDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  
  // Return original string if date parsing fails
  if (isNaN(date.getTime())) return dateStr;
  
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  
  const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                 (day === 2 || day === 22) ? 'nd' :
                 (day === 3 || day === 23) ? 'rd' : 'th';
                 
  return `${month} ${day}${suffix}, ${year}`;
}
