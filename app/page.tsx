import React from 'react';
import { getPrograms, getReviews, getNews } from '@/lib/content';
import HomepageContent from '@/components/HomepageContent';

// Force static rendering or dynamic revalidation every hour
export const revalidate = 3600;

export default function Page() {
  const programs = getPrograms();
  const reviews = getReviews();
  const news = getNews();

  return (
    <HomepageContent 
      programs={programs} 
      reviews={reviews} 
      news={news}
    />
  );
}
