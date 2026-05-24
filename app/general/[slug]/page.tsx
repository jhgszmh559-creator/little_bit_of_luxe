import React from 'react';
import { notFound } from 'next/navigation';
import { getGeneralBySlug, getGenerals } from '@/lib/content';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import { formatPremiumDate } from '@/lib/dateUtils';
import { stripToPlainText } from '@/lib/textUtils';
import SaveButton from '@/components/SaveButton';
import TableOfContents from '@/components/TableOfContents';
import AudioPlayer from '@/components/AudioPlayer';
import ShareMenu from '@/components/ShareMenu';
import VideoTheatre from '@/components/VideoTheatre';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getPartnerProgramForHotel } from '@/lib/perks';
import BookingWidget from '@/components/BookingWidget';

interface GeneralPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const generals = getGenerals();
  return generals.map((g) => ({
    slug: g.slug,
  }));
}

export default async function GeneralPage({ params }: GeneralPageProps) {
  const { slug } = await params;
  const general = getGeneralBySlug(slug);

  if (!general || general.status !== 'published') {
    notFound();
  }

  // Resolve dynamic partner program perks if a hotel/brand is specified
  const hasHotelInfo = !!(general.hotelName || general.brand);
  const program = hasHotelInfo ? getPartnerProgramForHotel(general.hotelName || '', general.brand || '') : null;
  const programName = program ? program.programName : '';
  const programNotes = program ? program.notes : '';
  const bookingLink = program ? program.partnerLink : '';

  // Parse markdown body
  const htmlContent = parseMarkdown(general.content);

  // Extract H2 and H3 headings for the Table of Contents
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match;
  while ((match = headingRegex.exec(general.content)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ id, text });
  }

  // Plain text for audio reader
  const plainText = stripToPlainText(general.content);

  // Get related general articles
  const allGenerals = getGenerals(false);
  const relatedGenerals = allGenerals
    .filter((g) => g.slug !== slug && g.status === 'published')
    .slice(0, 3);

  const articleUrl = `https://littlebitofluxe.com/general/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": general.title.replace(/[*_`]/g, ''),
    "description": general.excerpt.replace(/[*_`]/g, ''),
    "datePublished": general.date,
    "author": {
      "@type": "Organization",
      "name": "Little Bit of Luxe"
    },
    "image": general.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
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
              <Link href="/search?category=General+News">NEWS</Link>
              <span>/</span>
              <span>INSIGHTS</span>
            </div>

            <div className="lbl-eyebrow--accent mb-4">
              {general.category || 'Travel News & Insights'}
            </div>

            <h1 
              className="article-hero__title"
              dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(general.title) }}
            />

            <p 
              className="article-hero__dek"
              dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(general.excerpt) }}
            />

            <div className="article-hero__meta">
              <div className="article-hero__byline">
                <strong>By</strong> Our Editors
              </div>
              <div className="article-hero__metabits flex items-center gap-3">
                <span>3 MIN READ</span>
                <span>·</span>
                <span>{formatPremiumDate(general.date)}</span>
                <span>·</span>
                <SaveButton 
                  article={{
                    slug: general.slug,
                    title: general.title.replace(/[*_`]/g, ''),
                    type: 'general' as any,
                    date: general.date,
                    image: general.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                    location: 'Insights'
                  }} 
                />
              </div>
            </div>

            {/* Audio + Share Toolbar */}
            <div className="article-toolbar">
              <AudioPlayer articleText={plainText} />
              <ShareMenu url={articleUrl} title={general.title.replace(/[*_`]/g, '')} excerpt={general.excerpt} />
            </div>
          </header>

          {/* Media Block (Branded Video Theatre or Cover image) */}
          <div className="container" style={{ marginTop: 40 }}>
            <div className="article-hero__media">
              {general.heroVideo ? (
                <VideoTheatre
                  youtubeId={general.heroVideo}
                  title={general.title}
                  coverImage={general.image}
                  preload={true}
                />
              ) : (
                <Image 
                  src={general.image} 
                  alt={general.title} 
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-cover"
                  preload
                />
              )}
            </div>
            {general.heroCaption && (
              <p className="article-hero__caption" style={{ maxWidth: 760, margin: '12px auto 0' }}>
                {general.heroCaption}
              </p>
            )}
          </div>

          {/* Article Body with Table of Contents */}
          <div className="container" style={{ marginTop: 56 }}>
            <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-12">
              {/* Sidebar Table of Contents */}
              <TableOfContents headings={headings} />

              {/* Main Content Column */}
              <section className="flex-grow max-w-[720px]">
                {general.tldr && (
                  <div className="tldr-box mb-8">
                    <h4 className="tldr-box__title">The TL;DR</h4>
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdown(general.tldr) }} />
                  </div>
                )}

                <div 
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: htmlContent }} 
                />

                {/* QX Preferred Partner Perks CTA */}
                {general.showQxPerks && program && !general.content.includes('article-cta-box') && (
                  <BookingWidget 
                    hotelName={general.hotelName || 'this hotel'}
                    programName={programName}
                    programNotes={programNotes}
                    bookingLink={bookingLink}
                  />
                )}
              </section>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedGenerals.length > 0 && (
          <section className="container" style={{ marginTop: 96 }}>
            <header className="section-head">
              <h2>Keep <em>reading</em></h2>
            </header>
            <div className="grid-3">
              {relatedGenerals.map((related) => (
                <Link key={related.slug} href={`/general/${related.slug}`} className="card-article">
                  <div className="card-article__media">
                    <Image 
                      src={related.image} 
                      alt={related.title} 
                      fill
                      sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="card-article__eyebrow">
                    <div className="eyebrow">{related.category || 'Travel News'}</div>
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
