import React from 'react';
import { notFound } from 'next/navigation';
import { getReviewBySlug, getReviews } from '@/lib/content';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoTheatre from '@/components/VideoTheatre';
import Link from 'next/link';

interface ReviewPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for hotel reviews
export async function generateStaticParams() {
  const reviews = getReviews();
  return reviews.map((review) => ({
    slug: review.slug,
  }));
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const review = getReviewBySlug(slug);

  if (!review || review.status !== 'published') {
    notFound();
  }

  // Parse markdown body
  const htmlContent = parseMarkdown(review.content);

  // Extract H3 headings for automated Table of Contents
  const h3Regex = /^###\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match;
  h3Regex.lastIndex = 0;
  while ((match = h3Regex.exec(review.content)) !== null) {
    const text = match[1].replace(/[*_`]/g, '').trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ id, text });
  }

  // Get related reviews
  const allReviews = getReviews(false);
  const relatedReviews = allReviews
    .filter((r) => r.slug !== slug && r.status === 'published')
    .slice(0, 3);

  // Format verdict score
  const scoreStr = review.rating.toFixed(1);
  const [whole, decimal] = scoreStr.split('.');

  const coverImage = review.ogImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Hotel",
      "name": review.hotelName,
      "address": review.location
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": scoreStr,
      "bestRating": "10",
    },
    "author": {
      "@type": "Organization",
      "name": "Little Bit of Luxe"
    },
    "headline": review.title.replace(/[*_`]/g, ''),
    "datePublished": review.date,
    "image": coverImage
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="flex-grow py-12" data-screen-label="02 Article">
        {/* Breadcrumbs and Header */}
        <div className="container container--narrow">
          <div className="article-hero__crumbs">
            <Link href="/">JOURNAL</Link>
            <span>/</span>
            <Link href="/search?category=Hotel+Review">REVIEWS</Link>
            <span>/</span>
            <span>{review.location.toUpperCase()}</span>
          </div>

          <div className="lbl-eyebrow--accent mb-4">
            Hotel Review &amp; Inspection
          </div>

          <h1 
            className="article-hero__title"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(review.title) }}
          />

          <p 
            className="article-hero__dek"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(review.excerpt) }}
          />

          <div className="article-hero__meta">
            <div className="article-hero__byline">
              <strong>By</strong> Our Editors
            </div>
            <div className="article-hero__metabits">
              <span>5 MIN READ</span>
              <span>·</span>
              <span>{review.date}</span>
            </div>
          </div>
        </div>

        {/* Media Block (Branded Video Theatre or Cover image) */}
        <div className="container" style={{ marginTop: 40 }}>
          <div className="article-hero__media">
            {review.youtubeId ? (
              <VideoTheatre
                youtubeId={review.youtubeId}
                title={review.hotelName}
                coverImage={coverImage}
              />
            ) : (
              <img 
                src={coverImage} 
                alt={review.hotelName} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <p className="article-hero__caption" style={{ maxWidth: 760, margin: '12px auto 0' }}>
            {review.hotelName} in {review.location}, captured during our quiet inspection. — Our Editors
          </p>
        </div>

        {/* Verdict Summary Box right under the hero shot */}
        <div className="container container--narrow" style={{ marginTop: 40 }}>
          <div className="p-8 border border-rule-soft bg-paper-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <span className="lbl-eyebrow text-bordeaux mb-2 block">The Verdict Summary</span>
              <h4 className="lbl-h3 text-midnight mb-2">{review.hotelName}</h4>
              <p className="lbl-body text-sm font-sans mb-3 text-ink-3">
                <strong>Room Type:</strong> {review.roomType || 'Standard'} &nbsp;·&nbsp; <strong>Location:</strong> {review.location}
              </p>
              <p className="lbl-body text-sm italic text-ink-2 mb-0">
                "{review.excerpt}"
              </p>
            </div>
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-midnight bg-midnight text-sand shrink-0" style={{ borderRadius: '999px' }}>
              <span className="text-2xl font-serif font-bold">{whole}.<em>{decimal || '0'}</em></span>
              <span className="text-[10px] uppercase tracking-widest text-sand/65">/ 10</span>
            </div>
          </div>
        </div>

        {/* Article Body with Sidebar Table of Contents */}
        <div className="container" style={{ marginTop: 56 }}>
          <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-12">
            {/* Sidebar Table of Contents */}
            {headings.length > 0 && (
              <aside className="lg:w-64 shrink-0 lg:sticky lg:top-[120px] h-fit">
                <div className="border-b border-rule-soft pb-4 mb-4 select-none">
                  <h4 className="lbl-eyebrow text-bordeaux">Table of Contents</h4>
                </div>
                <nav className="flex flex-col gap-3">
                  {headings.map((h, i) => (
                    <a
                      key={i}
                      href={`#${h.id}`}
                      className="text-sm font-sans text-ink-3 hover:text-bordeaux transition-colors font-medium hover:underline block"
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </aside>
            )}

            {/* Main Content Column */}
            <article className="flex-grow max-w-[720px]">
              <div 
                className="prose"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />

              {/* QX Preferred Partner Perks CTA */}
              {review.showQxPerks && (
                <div className="article-cta-box">
                  <p className="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p>
                  <h3 className="lbl-h3 mb-4">Book {review.hotelName} with Perks</h3>
                  <p className="lbl-body mb-6">
                    Through our preferred partnerships, we unlock daily breakfast, priority upgrades, and property credits for standard direct bookings.
                  </p>
                  <a 
                    href="https://www.qxtravel.io/search-hotels" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-subscribe"
                  >
                    Book with Perks <span className="btn-subscribe__arrow">→</span>
                  </a>
                </div>
              )}

              {/* The Verdict Box (Detailed) */}
              <aside className="verdict">
                <div>
                  <div className="verdict__eyebrow">The Verdict</div>
                  <div 
                    className="verdict__head" 
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(`A considered residency *inspected*`) }}
                  />
                  <dl className="verdict__rows">
                    <dt className="k">Hotel</dt>
                    <dd style={{ margin: 0 }}>{review.hotelName}</dd>
                    
                    <dt className="k">Tested Room</dt>
                    <dd style={{ margin: 0 }}>{review.roomType || 'Standard Room'}</dd>
                    
                    <dt className="k">Key Highlight</dt>
                    <dd style={{ margin: 0 }}>Exceptional architecture and local integration</dd>
                  </dl>
                </div>
                <div className="verdict__score">
                  <div className="verdict__num">
                    {whole}.<em>{decimal || '0'}</em>
                  </div>
                  <div className="verdict__den">/ 10</div>
                </div>
              </aside>
            </article>
          </div>
        </div>

        {/* Related Articles Section */}
        {relatedReviews.length > 0 && (
          <section className="container" style={{ marginTop: 96 }}>
            <header className="section-head">
              <h2>Keep <em>reading</em></h2>
            </header>
            <div className="grid-3">
              {relatedReviews.map((related) => (
                <Link key={related.slug} href={`/review/${related.slug}`} className="card-article">
                  <div className="card-article__media">
                    <img 
                      src={related.ogImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"} 
                      alt={related.hotelName} 
                      loading="lazy" 
                    />
                    <div className="card-article__rating">
                      <em>★</em> {related.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="card-article__eyebrow">
                    <div className="eyebrow">{related.location}</div>
                  </div>
                  <h3 
                    className="card-article__title"
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(related.title) }}
                  />
                  <div className="card-article__byline">By Our Editors</div>
                  <div className="card-article__meta">{related.date}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
