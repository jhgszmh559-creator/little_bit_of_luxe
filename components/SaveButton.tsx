'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarks, Bookmark as BookmarkType } from '@/hooks/useBookmarks';

interface SaveButtonProps {
  article: BookmarkType;
  className?: string;
}

export default function SaveButton({ article, className = '' }: SaveButtonProps) {
  const { isBookmarked, toggleBookmark, mounted } = useBookmarks();

  if (!mounted) {
    return (
      <button className={`icon-btn ${className}`} aria-label="Save Article" disabled>
        <Bookmark className="w-5 h-5 stroke-[1.5]" />
      </button>
    );
  }

  const saved = isBookmarked(article.slug);

  return (
    <button 
      onClick={() => toggleBookmark(article)}
      className={`icon-btn ${className}`} 
      aria-label={saved ? "Remove Bookmark" : "Save Article"}
      title={saved ? "Remove from Saved Articles" : "Save Article"}
    >
      {saved ? (
        <BookmarkCheck className="w-5 h-5 stroke-[1.5] text-bordeaux dark:text-gold-soft" />
      ) : (
        <Bookmark className="w-5 h-5 stroke-[1.5]" />
      )}
    </button>
  );
}
