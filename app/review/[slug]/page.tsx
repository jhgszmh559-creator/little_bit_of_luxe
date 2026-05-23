import React from 'react';
import { notFound } from 'next/navigation';
import { getReviewBySlug, getReviews } from '@/lib/content';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import { formatPremiumDate } from '@/lib/dateUtils';
import { stripToPlainText } from '@/lib/textUtils';
import SaveButton from '@/components/SaveButton';
import TableOfContents from '@/components/TableOfContents';
import AudioPlayer from '@/components/AudioPlayer';
import ShareMenu from '@/components/ShareMenu';
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

  // Extract H2 and H3 headings for the Table of Contents
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match;
  while ((match = headingRegex.exec(review.content)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ id, text });
  }

  // Plain text for audio reader
  const plainText = stripToPlainText(review.content);

  // Get related reviews
  const allReviews = getReviews(false);
  const relatedReviews = allReviews
    .filter((r) => r.slug !== slug && r.status === 'published')
    .slice(0, 3);

  // Format verdict score
  const scoreStr = review.rating.toFixed(1);
  const [whole, decimal] = scoreStr.split('.');

  const coverImage = review.ogImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

  const articleUrl = `https://littlebitofluxe.com/review/${slug}`;

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
        <article>
          {/* Breadcrumbs and Header */}
          <header className="container container--narrow">
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
              <div className="article-hero__metabits flex items-center gap-3">
                <span>5 MIN READ</span>
                <span>·</span>
                <span>{formatPremiumDate(review.date)}</span>
                <span>·</span>
                <SaveButton 
                  article={{
                    slug: review.slug,
                    title: review.title.replace(/[*_`]/g, ''),
                    type: 'review',
                    date: review.date,
                    image: coverImage,
                    location: review.location
                  }} 
                />
              </div>
            </div>

            {/* Audio + Share Toolbar */}
            <div className="article-toolbar">
              <AudioPlayer articleText={plainText} />
              <ShareMenu url={articleUrl} title={review.title.replace(/[*_`]/g, '')} excerpt={review.excerpt} />
            </div>
          </header>

          {/* Media Block (Branded Video Theatre or Cover image) */}
          <div className="container" style={{ marginTop: 40 }}>
            <div className="article-hero__media">
              {(review.heroVideo || review.youtubeId) ? (
                <VideoTheatre
                  youtubeId={review.heroVideo || review.youtubeId || ''}
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
              {review.heroCaption || `${review.hotelName} in ${review.location}, captured during our quiet inspection. — Our Editors`}
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
                  &quot;{review.excerpt}&quot;
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
              <TableOfContents headings={headings} />

              {/* Main Content Column */}
              <section className="flex-grow max-w-[720px]">
                {review.tldr && (
                  <div className="tldr-box">
                    <h4 className="tldr-box__title">The TL;DR</h4>
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(review.tldr) }} />
                  </div>
                )}

                <div 
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: htmlContent }} 
                />

                {/* QX Preferred Partner Perks CTA */}
                {review.showQxPerks && !review.content.includes('article-cta-box') && (
                  <div className="article-cta-box">
                    <p className="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p>
                    <h3 className="lbl-h3 mb-4">Book {review.hotelName} with Perks</h3>
                    <p className="lbl-body mb-6">
                      Through our preferred partnerships, we unlock daily breakfast, priority upgrades, and property credits for standard direct bookings.
                    </p>
                    <a 
                      href={review.partnerLink || "https://www.qxtravel.io/search-hotels"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-subscribe"
                    >
                      Book with Perks <span className="btn-subscribe__arrow">→</span>
                    </a>
                  </div>
                )}

                {/* The Verdict Box (Detailed) */}
                {!review.content.includes('class="verdict"') && !review.content.includes('<aside') && (
                  <aside className="verdict">
                    <div>
                      <div className="verdict__eyebrow">The Verdict</div>
                      <div 
                        className="verdict__head" 
                        dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(review.verdictHead || `A considered residency *inspected*`) }}
                      />
                      <dl className="verdict__rows">
                        <dt className="k">Hotel</dt>
                        <dd style={{ margin: 0 }}>{review.hotelName}</dd>
                        
                        <dt className="k">Tested Room</dt>
                        <dd style={{ margin: 0 }}>{review.roomType || 'Standard Room'}</dd>
                        
                        <dt className="k">Key Highlight</dt>
                        <dd style={{ margin: 0 }}>{review.verdictHighlight || 'Exceptional architecture and local integration'}</dd>
                      </dl>
                    </div>
                    <div className="verdict__score">
                      <div className="verdict__num">
                        {whole}.<em>{decimal || '0'}</em>
                      </div>
                      <div className="verdict__den">/ 10</div>
                    </div>
                  </aside>
                )}
              </section>
            </div>
          </div>
        </article>

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
                  <div className="card-article__meta">{formatPremiumDate(related.date)}</div>
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
