import React from 'react';
import { getPrograms, getReviews, getNews, getGenerals } from '@/lib/content';
import HomepageContent from '@/components/HomepageContent';

// Force static rendering or dynamic revalidation every hour
export const revalidate = 3600;

export default function Page() {
  const reviews = getReviews(false);
  const programs = getPrograms(false);
  const news = getNews(false);
  const generals = getGenerals(false);

  return (
    <HomepageContent 
      programs={programs} 
      reviews={reviews} 
      news={news}
      generals={generals}
    />
  );
}

