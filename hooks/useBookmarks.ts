'use client';

import { useState, useEffect } from 'react';

export interface Bookmark {
  slug: string;
  title: string;
  type: 'review' | 'program' | 'news';
  date: string;
  image: string;
  location?: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('luxe_bookmarks');
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  }, []);

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem('luxe_bookmarks', JSON.stringify(newBookmarks));
    } catch (e) {
      console.error('Failed to save bookmarks', e);
    }
  };

  const isBookmarked = (slug: string) => {
    return bookmarks.some(b => b.slug === slug);
  };

  const toggleBookmark = (article: Bookmark) => {
    if (isBookmarked(article.slug)) {
      saveBookmarks(bookmarks.filter(b => b.slug !== article.slug));
    } else {
      saveBookmarks([...bookmarks, article]);
    }
  };

  return { bookmarks, isBookmarked, toggleBookmark, mounted };
}
