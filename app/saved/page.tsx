'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useBookmarks } from '@/hooks/useBookmarks';
import { formatPremiumDate } from '@/lib/dateUtils';
import { BookmarkMinus } from 'lucide-react';

export default function SavedArticlesPage() {
  const { bookmarks, toggleBookmark, mounted } = useBookmarks();

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Navbar />

      <main className="flex-grow py-12" data-screen-label="Saved Articles">
        <div className="container">
          <header className="mb-12 border-b border-rule-soft pb-8">
            <h1 className="text-4xl md:text-5xl font-serif text-midnight dark:text-sand">
              Saved Articles
            </h1>
            <p className="mt-4 text-ink-3 max-w-2xl text-lg">
              Your personal reading list of hotel reviews, portfolio programs, and dispatches.
            </p>
          </header>

          {!mounted ? (
            <div className="text-ink-3">Loading your bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-ink-3 text-lg mb-6">You haven't saved any articles yet.</p>
              <Link href="/" className="btn-subscribe">
                Explore the Journal
              </Link>
            </div>
          ) : (
            <div className="grid-4">
              {bookmarks.map((a) => (
                <div key={a.slug} className="relative group">
                  <Link href={`/${a.type}/${a.slug}`} className="card-article block">
                    <div className="card-article__image">
                      <img src={a.image} alt={a.title} />
                      <span className="featured__pill">{a.location || a.type.toUpperCase()}</span>
                    </div>
                    <div className="card-article__eyebrow mt-4 mb-2">
                      {a.type.toUpperCase()}
                    </div>
                    <h3 className="card-article__title text-xl mb-2">{a.title}</h3>
                    <div className="card-article__meta">{formatPremiumDate(a.date)}</div>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleBookmark(a);
                    }}
                    className="absolute top-2 right-2 p-2 bg-paper/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-paper"
                    title="Remove from Saved"
                  >
                    <BookmarkMinus className="w-4 h-4 text-bordeaux" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
