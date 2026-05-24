'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './Navbar';
import Footer from './Footer';
import { parseInlineMarkdown } from '@/lib/markdown';
import { formatPremiumDate } from '@/lib/dateUtils';

import BeehiivForm from './BeehiivForm';

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

interface HomepageContentProps {
  programs: ProgramData[];
  reviews: ReviewData[];
  news: NewsData[];
  generals?: any[];
  featuredReview?: ReviewData | null;
}

export default function HomepageContent({ programs, reviews, news = [], generals = [], featuredReview }: HomepageContentProps) {
  // Combine programs, reviews, and news into a unified list of articles
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
      rating: undefined, // Informational articles do not show a rating
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
      rating: undefined, // Informational articles do not show a rating
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

  // Partition articles into the UI template slots
  let featured: any = null;
  let rest = allArticles;

  if (featuredReview) {
    featured = {
      slug: featuredReview.slug,
      title: featuredReview.title,
      excerpt: featuredReview.excerpt,
      location: featuredReview.location,
      eyebrow: 'HOTEL REVIEW · ' + featuredReview.location.toUpperCase(),
      author: 'Our Editors',
      readTime: '8 MIN READ',
      date: featuredReview.date,
      rating: featuredReview.rating,
      cover: featuredReview.ogImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      category: 'Hotel Review',
      link: `/review/${featuredReview.slug}`,
    };
  } else {
    featured = allArticles[0];
    rest = allArticles.slice(1);
  }

  const latest = rest.slice(0, 3);
  const edit = rest.slice(3, 7);
  const more = rest.slice(7, 10);

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <Navbar />

      <main className="flex-grow" data-screen-label="01 Home">
        {/* Featured / Hero Story */}
        <div className="container" style={{ marginTop: 40 }}>
          {featured ? (
            <article className="featured">
              <Link href={featured.link} className="featured__media">
                <Image src={featured.cover} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover" preload />
                <span className="featured__pill">{featured.location}</span>
              </Link>
              <div className="featured__body">
                <div className="eyebrow eyebrow--accent">{featured.eyebrow}</div>
                <h1 className="featured__title">
                  <Link
                    href={featured.link}
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(featured.title) }}
                  />
                </h1>
                <p 
                  className="featured__dek"
                  dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(featured.excerpt) }}
                />
                <div className="featured__byline">
                  <span style={{ fontFamily: 'var(--lbl-serif)', fontStyle: 'italic', fontSize: 16 }}>
                    By {featured.author}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--lbl-sans)',
                      fontSize: 11,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      color: 'var(--lbl-ink-3)',
                    }}
                  >
                    {featured.readTime} · {formatPremiumDate(featured.date)}
                  </span>
                  {featured.rating != null && (
                    <span className="rating-stars" style={{ marginLeft: 'auto' }}>
                      <em style={{ fontStyle: 'normal', fontFamily: 'var(--lbl-serif)', fontSize: 28 }}>
                        ★ {featured.rating.toFixed(1)}
                      </em>
                      <span
                        style={{
                          fontFamily: 'var(--lbl-sans)',
                          fontSize: 11,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          color: 'var(--lbl-ink-3)',
                          marginLeft: 8,
                        }}
                      >
                        / 10
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="text-center py-20 border border-dashed border-midnight/10">
              <h3 className="font-serif italic text-2xl text-ink-2">
                No featured articles *available*
              </h3>
            </div>
          )}
        </div>

        {/* Latest */}
        {latest.length > 0 && (
          <section className="container" style={{ marginTop: 64 }}>
            <header className="section-head">
              <h2>
                Latest <em>dispatches</em>
              </h2>
              <Link className="section-head__link" href="/search">
                All stories →
              </Link>
            </header>
            <div className="grid-3">
              {latest.map((a) => (
                <Link key={a.slug} href={a.link} className="card-article">
                  <div className="card-article__media">
                    <Image src={a.cover} alt={a.title} fill sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw" className="object-cover" loading="lazy" />
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
                  <div className="card-article__meta">{formatPremiumDate(a.date)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* The Edit — midnight rail */}
        {edit.length > 0 && (
          <section className="edit-rail">
            <div className="container">
              <header className="section-head">
                <h2>
                  The <em>Edit</em>
                </h2>
                <Link className="section-head__link" href="/search">
                  Browse the edit →
                </Link>
              </header>
              <div className="grid-4">
                {edit.map((a) => (
                  <Link key={a.slug} href={a.link} className="card-article">
                    <div className="card-article__media">
                      <Image src={a.cover} alt={a.title} fill sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 25vw" className="object-cover" loading="lazy" />
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
                    <div className="card-article__meta">{formatPremiumDate(a.date)}</div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* More to read */}
        {more.length > 0 && (
          <section className="container" style={{ marginTop: 96 }}>
            <header className="section-head">
              <h2>
                More to <em>read</em>
              </h2>
              <Link className="section-head__link" href="/search">
                Search the archive →
              </Link>
            </header>
            <div className="grid-3">
              {more.map((a) => (
                <Link key={a.slug} href={a.link} className="card-article">
                  <div className="card-article__media">
                    <Image src={a.cover} alt={a.title} fill sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw" className="object-cover" loading="lazy" />
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
                  <div className="card-article__meta">{formatPremiumDate(a.date)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Newsletter />
      </main>

      <Footer />
    </div>
  );
}

function Newsletter() {
  return (
    <section className="newsletter" id="newsletter">
      <div className="newsletter__inner">
        <div className="eyebrow">The Letter · Saturdays</div>
        <h2>
          One <em>email</em> a week. Worth opening.
        </h2>
        <p>Our editors' notes on where to go and where to skip, before the rush.</p>
        <BeehiivForm className="max-w-[480px] mx-auto" />
      </div>
    </section>
  );
}
