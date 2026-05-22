import React from 'react';
import { getPrograms, getReviews, getNews } from '@/lib/content';
import AdminDashboardClient from './AdminDashboardClient';

// Ensure CMS isn't statically optimized so dashboard loads freshly
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const programs = getPrograms(true);
  const reviews = getReviews(true);
  const news = getNews(true);

  return (
    <AdminDashboardClient 
      programs={programs} 
      reviews={reviews} 
      news={news}
    />
  );
}

