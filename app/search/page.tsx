import React, { Suspense } from 'react';
import { getPrograms, getReviews, getNews, getGenerals } from '@/lib/content';
import SearchPageClient from './SearchPageClient';

export const revalidate = 3600;

export default function SearchPage() {
  const programs = getPrograms();
  const reviews = getReviews();
  const news = getNews();
  const generals = getGenerals();

  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-paper justify-center items-center">
        <div className="font-serif italic text-xl text-ink-2">Loading the archive...</div>
      </div>
    }>
      <SearchPageClient 
        programs={programs} 
        reviews={reviews} 
        news={news}
        generals={generals}
      />
    </Suspense>
  );
}

