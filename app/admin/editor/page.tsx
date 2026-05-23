import React from 'react';
import { 
  getProgramBySlug, 
  getReviewBySlug, 
  getNewsBySlug, 
  getGeneralBySlug,
  getPrograms, 
  getReviews, 
  getNews,
  getGenerals
} from '@/lib/content';
import EditorForm from './EditorForm';

interface EditorPageProps {
  searchParams: Promise<{
    type?: string;
    slug?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { type = 'review', slug = '' } = await searchParams;

  let initialData = null;

  if (slug) {
    if (type === 'program') {
      const prog = getProgramBySlug(slug);
      if (prog) {
        initialData = {
          title: prog.title,
          excerpt: prog.excerpt,
          content: prog.content,
          category: prog.category,
          draft: prog.draft,
          status: prog.status,
          sources: prog.sources || [],
          date: prog.date,
          programName: prog.programName,
          loyaltyNetwork: prog.loyaltyNetwork,
          brands: prog.brands,
          officialLink: prog.officialLink,
          partnerLink: prog.partnerLink,
          image: prog.image,
          tldr: prog.tldr || '',
          galleryStyle: prog.galleryStyle || 'grid',
          verdictBestFor: prog.verdict?.best_for || '',
          verdictHighlight: prog.verdict?.highlight || '',
          verdictScore: prog.verdict?.score || '',
        };
      }
    } else if (type === 'news') {
      const newsItem = getNewsBySlug(slug);
      if (newsItem) {
        initialData = {
          title: newsItem.title,
          excerpt: newsItem.excerpt,
          content: newsItem.content,
          category: newsItem.category,
          draft: newsItem.draft,
          status: newsItem.status,
          sources: newsItem.sources || [],
          date: newsItem.date,
          brand: newsItem.brand,
          propertyName: newsItem.propertyName,
          location: newsItem.location,
          projectedOpening: newsItem.projectedOpening,
          earlyNewsletterCta: newsItem.earlyNewsletterCta,
          sourceUrl: newsItem.sourceUrl,
          ogImage: newsItem.image,
          tldr: newsItem.tldr || '',
          partnerLink: newsItem.partnerLink || '',
          galleryStyle: newsItem.galleryStyle || 'grid',
        };
      }
    } else if (type === 'general') {
      const gen = getGeneralBySlug(slug);
      if (gen) {
        initialData = {
          title: gen.title,
          excerpt: gen.excerpt,
          content: gen.content,
          category: gen.category,
          draft: gen.draft,
          status: gen.status,
          sources: gen.sources || [],
          date: gen.date,
          ogImage: gen.image,
          tldr: gen.tldr || '',
          galleryStyle: gen.galleryStyle || 'grid',
          heroVideo: gen.heroVideo || '',
          heroCaption: gen.heroCaption || '',
        };
      }
    } else {
      const review = getReviewBySlug(slug);
      if (review) {
        initialData = {
          title: review.title,
          excerpt: review.excerpt,
          content: review.content,
          category: review.category,
          draft: review.draft,
          status: review.status,
          sources: review.sources || [],
          date: review.date,
          hotelName: review.hotelName,
          brand: review.brand,
          location: review.location,
          rating: review.rating,
          roomType: review.roomType,
          youtubeId: review.youtubeId,
          showQxPerks: review.showQxPerks,
          metaTitle: review.metaTitle,
          metaDescription: review.metaDescription,
          ogImage: review.ogImage,
          tldr: review.tldr || '',
          verdictHead: review.verdictHead || '',
          verdictHighlight: review.verdictHighlight || '',
          partnerLink: review.partnerLink || '',
          galleryStyle: review.galleryStyle || 'grid',
        };
      }
    }
  }

  const allArticles = [
    ...getPrograms(true).map(p => ({ title: p.title, slug: p.slug, category: p.category, type: 'program' as const })),
    ...getReviews(true).map(r => ({ title: r.title, slug: r.slug, category: r.category, type: 'review' as const })),
    ...getNews(true).map(n => ({ title: n.title, slug: n.slug, category: n.category, type: 'news' as const })),
    ...getGenerals(true).map(g => ({ title: g.title, slug: g.slug, category: g.category, type: 'general' as const }))
  ];

  return (
    <EditorForm 
      key={`${type}-${slug}`}
      type={type as 'review' | 'program' | 'news' | 'general'} 
      slug={slug} 
      initialData={initialData} 
      allArticles={allArticles}
    />
  );
}


