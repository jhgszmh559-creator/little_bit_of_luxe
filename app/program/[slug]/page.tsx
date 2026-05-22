import React from 'react';
import { notFound } from 'next/navigation';
import { getProgramBySlug, getPrograms } from '@/lib/content';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import { formatPremiumDate } from '@/lib/dateUtils';
import SaveButton from '@/components/SaveButton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import QxScrollBlock from '@/components/QxScrollBlock';
import Link from 'next/link';

interface ProgramPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for partner programs
export async function generateStaticParams() {
  const programs = getPrograms();
  return programs.map((program) => ({
    slug: program.slug,
  }));
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program || program.status !== 'published') {
    notFound();
  }

  // Strip leading H1 and H2 (dek) if they are at the top of the body to avoid duplicating the page title
  let cleanedContent = program.content;
  cleanedContent = cleanedContent.replace(/^#\s+.+$/m, '');
  cleanedContent = cleanedContent.replace(/^##\s+.+$/m, '');
  cleanedContent = cleanedContent.trim();

  // Parse markdown body
  const htmlContent = parseMarkdown(cleanedContent);

  // Get related programs
  const allPrograms = getPrograms(false);
  const relatedPrograms = allPrograms
    .filter((p) => p.slug !== slug && p.status === 'published')
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": program.title.replace(/[*_`]/g, ''),
    "description": program.excerpt.replace(/[*_`]/g, ''),
    "datePublished": program.date,
    "author": {
      "@type": "Organization",
      "name": "Little Bit of Luxe"
    },
    "image": program.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Sticky Header Info Bar */}
      <div className="sticky top-[80px] z-30 bg-paper-2 border-b border-rule-soft py-3 select-none">
        <div className="container flex justify-between items-center text-xs">
          <span className="lbl-eyebrow text-ink-3">Portfolio Program</span>
          <span className="font-serif italic text-ink-2">{program.programName} ({program.loyaltyNetwork})</span>
        </div>
      </div>

      <main className="flex-grow py-12" data-screen-label="02 Article">
        {/* Breadcrumbs and Header */}
        <div className="container container--narrow">
          <div className="article-hero__crumbs">
            <Link href="/">JOURNAL</Link>
            <span>/</span>
            <Link href="/search?category=Preferred+Partner">THE EDIT</Link>
            <span>/</span>
            <span>{program.loyaltyNetwork.toUpperCase()}</span>
          </div>

          <div className="lbl-eyebrow--accent mb-4">
            {program.loyaltyNetwork} Network Portfolio
          </div>

          <h1 
            className="article-hero__title"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(program.title) }}
          />

          <p 
            className="article-hero__dek"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(program.excerpt) }}
          />

          <div className="article-hero__meta">
            <div className="article-hero__byline">
              <strong>By</strong> Our Editors
            </div>
            <div className="article-hero__metabits flex items-center gap-3">
              <span>5 MIN READ</span>
              <span>·</span>
              <span>{formatPremiumDate(program.date)}</span>
              <span>·</span>
              <SaveButton 
                article={{
                  slug: program.slug,
                  title: program.title.replace(/[*_`]/g, ''),
                  type: 'program',
                  date: program.date,
                  image: program.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                  location: program.loyaltyNetwork
                }} 
              />
            </div>
          </div>
        </div>

        {/* Banner Media Block */}
        <div className="container" style={{ marginTop: 40 }}>
          <div className="article-hero__media">
            <img 
              src={program.image} 
              alt={program.programName} 
              className="w-full h-full object-cover"
            />
          </div>
          <p className="article-hero__caption" style={{ maxWidth: 760, margin: '12px auto 0' }}>
            {program.programName} portfolio, curated with considered luxury. — Our Editors
          </p>
        </div>

        {/* Article Body */}
        <article className="container container--narrow" style={{ marginTop: 56 }}>
          {/* Participating Brands Eyebrow Banner */}
          <div className="mb-8 p-6 bg-paper-2 border-l-2 border-bordeaux">
            <span className="lbl-eyebrow text-ink-2 mb-2 block">Participating Portfolios</span>
            <p className="font-sans text-sm text-ink-3 leading-relaxed">
              {program.brands}
            </p>
          </div>

          <div 
            className="prose"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
          />

          {/* Program Verdict Card */}
          {program.verdict && (
            <div className="my-12 p-8 border border-rule-soft bg-paper-2 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1">
                <span className="lbl-eyebrow text-bordeaux mb-2 block">The Verdict</span>
                <h3 className="lbl-h3 text-midnight mb-4">Our Program Verdict</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {program.verdict.best_for && (
                    <div>
                      <dt className="lbl-eyebrow text-ink-3 text-[10px] mb-1">Best For</dt>
                      <dd className="lbl-body text-sm font-medium">{program.verdict.best_for}</dd>
                    </div>
                  )}
                  {program.verdict.highlight && (
                    <div>
                      <dt className="lbl-eyebrow text-ink-3 text-[10px] mb-1">Highlight</dt>
                      <dd className="lbl-body text-sm font-medium">{program.verdict.highlight}</dd>
                    </div>
                  )}
                </dl>
              </div>
              {program.verdict.score && (
                <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 border-midnight bg-midnight text-sand">
                  <span className="text-2xl font-serif font-bold">{program.verdict.score}</span>
                  <span className="text-[10px] uppercase tracking-widest text-sand/65">/ 10</span>
                </div>
              )}
            </div>
          )}
        </article>

        {/* Related Articles Section */}
        {relatedPrograms.length > 0 && (
          <section className="container" style={{ marginTop: 96 }}>
            <header className="section-head">
              <h2>Keep <em>reading</em></h2>
            </header>
            <div className="grid-3">
              {relatedPrograms.map((related) => (
                <Link key={related.slug} href={`/program/${related.slug}`} className="card-article">
                  <div className="card-article__media">
                    <img 
                      src={related.image} 
                      alt={related.programName} 
                      loading="lazy" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="card-article__eyebrow">
                    <div className="eyebrow">{related.loyaltyNetwork}</div>
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

      {/* QX Travel Engine Scroll Block */}
      <QxScrollBlock programName={program.programName} partnerLink={program.partnerLink} />

      <Footer />
    </div>
  );
}
