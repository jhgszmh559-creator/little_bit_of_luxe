import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content');

// Helper to resolve fields from frontmatter supporting both camelCase and snake_case
function getField<T>(data: any, camelKey: string, snakeKey: string, defaultValue: T): T {
  if (data[camelKey] !== undefined) return data[camelKey];
  if (data[snakeKey] !== undefined) return data[snakeKey];
  return defaultValue;
}

function getStatus(data: any): 'published' | 'draft' | 'archived' {
  if (data.status === 'published' || data.status === 'draft' || data.status === 'archived') {
    return data.status;
  }
  return data.draft === true ? 'draft' : 'published';
}

export interface Program {
  slug: string;
  title: string;
  excerpt: string;
  programName: string;
  loyaltyNetwork: string;
  brands: string;
  officialLink: string;
  partnerLink: string;
  date: string;
  category: string;
  draft: boolean;
  status: 'published' | 'draft' | 'archived';
  sources?: string[];
  image: string;
  content: string;
  galleryStyle?: string;
  tldr?: string;
  verdict?: {
    best_for?: string;
    highlight?: string;
    score?: string;
  };
}

export interface Review {
  slug: string;
  title: string;
  excerpt: string;
  hotelName: string;
  brand: string;
  location: string;
  rating: number;
  roomType: string;
  youtubeId?: string;
  showQxPerks: boolean;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  date: string;
  draft: boolean;
  status: 'published' | 'draft' | 'archived';
  sources?: string[];
  category: string;
  content: string;
  galleryStyle?: string;
  partnerLink?: string;
  tldr?: string;
  verdictHead?: string;
  verdictHighlight?: string;
}

export interface News {
  slug: string;
  title: string;
  excerpt: string;
  brand: string;
  propertyName: string;
  location: string;
  projectedOpening: string;
  earlyNewsletterCta: boolean;
  sourceUrl?: string;
  date: string;
  draft: boolean;
  status: 'published' | 'draft' | 'archived';
  sources?: string[];
  category: string;
  image: string;
  content: string;
  galleryStyle?: string;
  partnerLink?: string;
  tldr?: string;
}

export function getPrograms(includeHidden = false): Program[] {
  const dirPath = path.join(contentDir, 'programs');
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath);
  const programs = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const rawVerdict = data.verdict;
      let verdict: any = undefined;
      if (rawVerdict) {
        verdict = {
          best_for: rawVerdict.best_for || rawVerdict.bestFor || '',
          highlight: rawVerdict.highlight || '',
          score: rawVerdict.score !== undefined ? String(rawVerdict.score) : '',
        };
      }

      const status = getStatus(data);

      return {
        slug,
        title: data.title || '',
        excerpt: data.excerpt || '',
        programName: getField(data, 'programName', 'program_name', ''),
        loyaltyNetwork: getField(data, 'loyaltyNetwork', 'loyalty_network', 'Independent'),
        brands: data.brands || '',
        officialLink: getField(data, 'officialLink', 'official_link', ''),
        partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
        date: data.date || '',
        category: data.category || 'Preferred Partner',
        status,
        draft: status !== 'published',
        sources: data.sources || [],
        image: getField(data, 'image', 'image', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
        content,
        verdict,
        galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
        tldr: getField(data, 'tldr', 'tldr', ''),
      };
    })
    .filter(program => includeHidden || program.status === 'published');

  return programs.sort((a, b) => b.date.localeCompare(a.date));
}

export function getReviews(includeHidden = false): Review[] {
  const dirPath = path.join(contentDir, 'reviews');
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath);
  const reviews = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const hotelName = getField(data, 'hotelName', 'hotel_name', getField(data, 'propertyName', 'property_name', ''));
      const ratingVal = data.rating !== undefined ? data.rating : data.score;
      const status = getStatus(data);

      return {
        slug,
        title: data.title || '',
        excerpt: data.excerpt || '',
        hotelName,
        brand: data.brand || '',
        location: data.location || '',
        rating: ratingVal !== undefined ? Number(ratingVal) : 9.0,
        roomType: getField(data, 'roomType', 'room_type', ''),
        youtubeId: getField(data, 'youtubeId', 'youtube_id', ''),
        showQxPerks: getField<boolean>(data, 'showQxPerks', 'show_qx_perks', getField<boolean>(data, 'showPerks', 'show_perks', true)) !== false,
        metaTitle: getField(data, 'metaTitle', 'meta_title', ''),
        metaDescription: getField(data, 'metaDescription', 'meta_description', ''),
        ogImage: getField(data, 'ogImage', 'og_image', getField(data, 'image', 'image', '')),
        date: data.date || '',
        status,
        draft: status !== 'published',
        sources: data.sources || [],
        category: data.category || 'Hotel Review',
        content,
        galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
        partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
        tldr: getField(data, 'tldr', 'tldr', ''),
        verdictHead: getField(data, 'verdictHead', 'verdict_head', ''),
        verdictHighlight: getField(data, 'verdictHighlight', 'verdict_highlight', ''),
      };
    })
    .filter(review => includeHidden || review.status === 'published');

  return reviews.sort((a, b) => b.date.localeCompare(a.date));
}

export function getNews(includeHidden = false): News[] {
  const dirPath = path.join(contentDir, 'news');
  if (!fs.existsSync(dirPath)) return [];

  const files = fs.readdirSync(dirPath);
  const newsList = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const slug = file.replace(/\.md$/, '');
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const status = getStatus(data);

      return {
        slug,
        title: data.title || '',
        excerpt: data.excerpt || '',
        brand: data.brand || '',
        propertyName: getField(data, 'propertyName', 'property_name', ''),
        location: data.location || '',
        projectedOpening: getField(data, 'projectedOpening', 'projected_opening', ''),
        earlyNewsletterCta: getField(data, 'earlyNewsletterCta', 'early_newsletter_cta', false),
        sourceUrl: getField(data, 'sourceUrl', 'source_url', ''),
        date: data.date || '',
        status,
        draft: status !== 'published',
        sources: data.sources || [],
        category: data.category || 'Hotel News',
        image: getField(data, 'image', 'image', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
        content,
        galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
        partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
        tldr: getField(data, 'tldr', 'tldr', ''),
      };
    })
    .filter(news => includeHidden || news.status === 'published');

  return newsList.sort((a, b) => b.date.localeCompare(a.date));
}

export function getProgramBySlug(slug: string): Program | null {
  const filePath = path.join(contentDir, 'programs', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const rawVerdict = data.verdict;
  let verdict: any = undefined;
  if (rawVerdict) {
    verdict = {
      best_for: rawVerdict.best_for || rawVerdict.bestFor || '',
      highlight: rawVerdict.highlight || '',
      score: rawVerdict.score !== undefined ? String(rawVerdict.score) : '',
    };
  }

  const status = getStatus(data);

  return {
    slug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    programName: getField(data, 'programName', 'program_name', ''),
    loyaltyNetwork: getField(data, 'loyaltyNetwork', 'loyalty_network', 'Independent'),
    brands: data.brands || '',
    officialLink: getField(data, 'officialLink', 'official_link', ''),
    partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
    date: data.date || '',
    category: data.category || 'Preferred Partner',
    status,
    draft: status !== 'published',
    sources: data.sources || [],
    image: getField(data, 'image', 'image', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
    content,
    verdict,
    galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
    tldr: getField(data, 'tldr', 'tldr', ''),
  };
}

export function getReviewBySlug(slug: string): Review | null {
  const filePath = path.join(contentDir, 'reviews', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const hotelName = getField(data, 'hotelName', 'hotel_name', getField(data, 'propertyName', 'property_name', ''));
  const ratingVal = data.rating !== undefined ? data.rating : data.score;
  const status = getStatus(data);

  return {
    slug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    hotelName,
    brand: data.brand || '',
    location: data.location || '',
    rating: ratingVal !== undefined ? Number(ratingVal) : 9.0,
    roomType: getField(data, 'roomType', 'room_type', ''),
    youtubeId: getField(data, 'youtubeId', 'youtube_id', ''),
    showQxPerks: getField<boolean>(data, 'showQxPerks', 'show_qx_perks', getField<boolean>(data, 'showPerks', 'show_perks', true)) !== false,
    metaTitle: getField(data, 'metaTitle', 'meta_title', ''),
    metaDescription: getField(data, 'metaDescription', 'meta_description', ''),
    ogImage: getField(data, 'ogImage', 'og_image', getField(data, 'image', 'image', '')),
    date: data.date || '',
    status,
    draft: status !== 'published',
    sources: data.sources || [],
    category: data.category || 'Hotel Review',
    content,
    galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
    partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
    tldr: getField(data, 'tldr', 'tldr', ''),
    verdictHead: getField(data, 'verdictHead', 'verdict_head', ''),
    verdictHighlight: getField(data, 'verdictHighlight', 'verdict_highlight', ''),
  };
}

export function getNewsBySlug(slug: string): News | null {
  const filePath = path.join(contentDir, 'news', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const status = getStatus(data);

  return {
    slug,
    title: data.title || '',
    excerpt: data.excerpt || '',
    brand: data.brand || '',
    propertyName: getField(data, 'propertyName', 'property_name', ''),
    location: data.location || '',
    projectedOpening: getField(data, 'projectedOpening', 'projected_opening', ''),
    earlyNewsletterCta: getField(data, 'earlyNewsletterCta', 'early_newsletter_cta', false),
    sourceUrl: getField(data, 'sourceUrl', 'source_url', ''),
    date: data.date || '',
    status,
    draft: status !== 'published',
    sources: data.sources || [],
    category: data.category || 'Hotel News',
    image: getField(data, 'image', 'image', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
    content,
    galleryStyle: getField(data, 'galleryStyle', 'gallery_style', 'grid'),
    partnerLink: getField(data, 'partnerLink', 'partner_link', ''),
    tldr: getField(data, 'tldr', 'tldr', ''),
  };
}
