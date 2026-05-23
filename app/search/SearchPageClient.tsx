'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { parseInlineMarkdown } from '@/lib/markdown';

interface ProgramData {
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
  image: string;
}

interface ReviewData {
  slug: string;
  title: string;
  excerpt: string;
  hotelName: string;
  brand: string;
  location: string;
  rating: number;
  roomType: string;
  showQxPerks: boolean;
  date: string;
  category: string;
  ogImage?: string;
}

interface NewsData {
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
  image: string;
  category: string;
}

interface SearchPageClientProps {
  programs: ProgramData[];
  reviews: ReviewData[];
  news?: NewsData[];
  generals?: any[];
}

export default function SearchPageClient({ programs, reviews, news = [], generals = [] }: SearchPageClientProps) {
  const searchParams = useSearchParams();

  // Unified list of articles formatted to match ArticleCard requirements
  const allArticles = [
    ...programs.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      location: p.loyaltyNetwork + ' Network',
      eyebrow: 'PREFERRED PARTNER · ' + p.loyaltyNetwork.toUpperCase(),
      author: 'Our Editors',
      readTime: '5 MIN READ',
      date: p.date,
      rating: undefined,
      cover: p.image,
      category: 'Preferred Partner',
      link: `/program/${p.slug}`,
    })),
    ...reviews.map((r) => ({
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      location: r.location,
      eyebrow: 'HOTEL REVIEW · ' + r.location.toUpperCase(),
      author: 'Our Editors',
      readTime: '8 MIN READ',
      date: r.date,
      rating: r.rating,
      cover: r.ogImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      category: 'Hotel Review',
      link: `/review/${r.slug}`,
    })),
    ...news.map((n) => ({
      slug: n.slug,
      title: n.title,
      excerpt: n.excerpt,
      location: n.location,
      eyebrow: 'HOTEL NEWS · ' + n.location.toUpperCase(),
      author: 'Our Editors',
      readTime: '3 MIN READ',
      date: n.date,
      rating: undefined,
      cover: n.image,
      category: 'Hotel News',
      link: `/news/${n.slug}`,
    })),
    ...generals.map((g) => ({
      slug: g.slug,
      title: g.title,
      excerpt: g.excerpt,
      location: 'Insights',
      eyebrow: 'TRAVEL NEWS',
      author: 'Our Editors',
      readTime: '3 MIN READ',
      date: g.date,
      rating: undefined,
      cover: g.image,
      category: 'General News',
      link: `/general/${g.slug}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Initialize state from URL params
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    const urlCat = searchParams.get('category') || 'All';
    setQ(urlQ);
    setCat(urlCat);
  }, [searchParams]);

  // Update URL search parameters instantly
  const handleQueryChange = (val: string) => {
    setQ(val);
    updateUrl(val, cat);
  };

  const handleCategoryChange = (val: string) => {
    setCat(val);
    updateUrl(q, val);
  };

  const updateUrl = (query: string, category: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category && category !== 'All') params.set('category', category);
    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : '/search';
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };

  // Filter content
  const filtered = allArticles.filter((a) => {
    const matchesCat = cat === 'All' || a.category === cat;
    const matchesQ =
      !q ||
      (a.title + ' ' + a.location + ' ' + a.excerpt + ' ' + a.category)
        .toLowerCase()
        .includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  const categories = [
    { value: 'All', label: 'All Sections' },
    { value: 'Hotel Review', label: 'Reviews' },
    { value: 'Dispatch', label: 'Dispatches' },
    { value: 'Preferred Partner', label: 'The Edit' },
    { value: 'Guides', label: 'Guides' },
    { value: 'Hotel News', label: 'News' },
    { value: 'General News', label: 'Insights' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Navbar />

      <main className="flex-grow py-12" data-screen-label="03 Search">
        {/* Search Hero */}
        <section className="container search-hero">
          <div className="eyebrow">The Archive</div>
          <h1>
            Search the <em>archive</em>
          </h1>
          <div className="search-input">
            <SearchIcon className="w-[22px] h-[22px] stroke-[1.5]" />
            <input
              type="text"
              placeholder="Four Seasons, Hyatt Privé, Marriott Luminous..."
              value={q}
              onChange={(e) => handleQueryChange(e.target.value)}
              autoFocus
            />
          </div>
        </section>

        {/* Filters and Results Section */}
        <section className="container" style={{ marginTop: 40 }}>
          <div className="filters">
            <span className="filters__label">Section</span>
            <div className="filters__chips">
              {categories.map((c) => (
                <button
                  key={c.value}
                  className={`tag ${cat === c.value ? 'is-active' : ''}`}
                  onClick={() => handleCategoryChange(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="results-head">
            <span className="results-head__count">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              {q && <span> · "{q}"</span>}
            </span>
            <span className="results-head__sort">
              Sort ·{' '}
              <span style={{ borderBottom: '1px solid currentColor', paddingBottom: 1 }}>
                Newest first
              </span>
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: 'var(--lbl-serif)',
                  fontStyle: 'italic',
                  fontSize: 24,
                  color: 'var(--lbl-ink-2)',
                }}
              >
                Nothing in the archive matches that — try a different word.
              </p>
            </div>
          ) : (
            <div className="grid-3" style={{ marginBottom: 96 }}>
              {filtered.map((a) => (
                <Link key={a.slug} href={a.link} className="card-article">
                  <div className="card-article__media">
                    <img src={a.cover} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
                    {a.rating != null && (
                      <div className="card-article__rating">
                        <em>★</em> {a.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="card-article__eyebrow">
                    <div className="eyebrow">{a.location}</div>
                  </div>
                  <h3
                    className="card-article__title"
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(a.title) }}
                  />
                  <div className="card-article__byline">By {a.author}</div>
                  <div className="card-article__meta">{a.date}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
