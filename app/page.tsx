import React from 'react';
import { getPrograms, getReviews, getNews } from '@/lib/content';
import HomepageContent from '@/components/HomepageContent';

// Force static rendering or dynamic revalidation every hour
export const revalidate = 3600;

export default function Page() {
  // Main query fetching data for the primary visual hero component explicitly uses getReviews(false)
  const reviews = getReviews(false);
  const featuredReview = reviews[0] || null;
  const remainingReviews = reviews.slice(1);
  const programs = getPrograms(false);
  const news = getNews(false);

  return (
    <HomepageContent 
      programs={programs} 
      reviews={remainingReviews} 
      news={news}
      featuredReview={featuredReview}
    />
  );
}
