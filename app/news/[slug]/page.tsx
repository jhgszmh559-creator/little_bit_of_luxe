import React from 'react';
import { notFound } from 'next/navigation';
import { getNewsBySlug, getNews } from '@/lib/content';
import { parseMarkdown, parseInlineMarkdown } from '@/lib/markdown';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BeehiivForm from '@/components/BeehiivForm';
import Link from 'next/link';

interface NewsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for hotel news
export async function generateStaticParams() {
  const newsList = getNews();
  return newsList.map((news) => ({
    slug: news.slug,
  }));
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { slug } = await params;
  const news = getNewsBySlug(slug);

  if (!news || news.status !== 'published') {
    notFound();
  }

  // Parse markdown body
  const htmlContent = parseMarkdown(news.content);

  // Get related news
  const allNews = getNews(false);
  const relatedNews = allNews
    .filter((n) => n.slug !== slug && n.status === 'published')
    .slice(0, 3);

  // Splitting content for early newsletter CTA if required
  let renderedContent;
  if (news.earlyNewsletterCta) {
    const paragraphs = htmlContent.split('</p>');
    if (paragraphs.length > 3) {
      const firstPart = paragraphs.slice(0, 3).join('</p>') + '</p>';
      const secondPart = paragraphs.slice(3).join('</p>');
      renderedContent = (
        <>
          <div className="prose" dangerouslySetInnerHTML={{ __html: firstPart }} />
          
          <div className="article-cta-box">
            <p className="lbl-eyebrow mb-2 text-sand/70">The Edit Newsletter</p>
            <h3 className="lbl-h3 mb-4">Stay ahead of the next <em>opening</em></h3>
            <p className="lbl-body mb-6">
              Subscribe to our weekly dispatch of the world's finest newly opened properties and travel design news.
            </p>
            <BeehiivForm />
          </div>

          <div className="prose" dangerouslySetInnerHTML={{ __html: secondPart }} />
        </>
      );
    } else {
      renderedContent = <div className="prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    }
  } else {
    renderedContent = <div className="prose" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": news.title.replace(/[*_`]/g, ''),
    "description": news.excerpt.replace(/[*_`]/g, ''),
    "datePublished": news.date,
    "author": {
      "@type": "Organization",
      "name": "Little Bit of Luxe"
    },
    "image": news.image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
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
            <Link href="/search?category=Hotel+News">NEWS</Link>
            <span>/</span>
            <span>{news.location.toUpperCase()}</span>
          </div>

          <div className="lbl-eyebrow--accent mb-4">
            Hotel News &amp; Openings
          </div>

          <h1 
            className="article-hero__title"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(news.title) }}
          />

          <p 
            className="article-hero__dek"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(news.excerpt) }}
          />

          <div className="article-hero__meta">
            <div className="article-hero__byline">
              <strong>By</strong> Our Editors
            </div>
            <div className="article-hero__metabits">
              <span>3 MIN READ</span>
              <span>·</span>
              <span>{news.date}</span>
            </div>
          </div>
        </div>

        {/* Media Block (Cover image) */}
        <div className="container" style={{ marginTop: 40 }}>
          <div className="article-hero__media">
            <img 
              src={news.image} 
              alt={news.propertyName} 
              className="w-full h-full object-cover"
            />
          </div>
          <p className="article-hero__caption" style={{ maxWidth: 760, margin: '12px auto 0' }}>
            {news.propertyName} brand vision, slated for {news.projectedOpening}. — Our Editors
          </p>
        </div>

        {/* Article Body with Sidebar layout / narrow layout */}
        <article className="container container--narrow" style={{ marginTop: 56 }}>
          {/* Quick Facts Data Matrix */}
          <div className="mb-8 p-6 bg-paper-2 border border-rule-soft grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-1">Brand</span>
              <span className="font-sans text-sm font-semibold text-midnight">{news.brand || 'Independent'}</span>
            </div>
            <div>
              <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-1">Property</span>
              <span className="font-sans text-sm font-semibold text-midnight">{news.propertyName}</span>
            </div>
            <div>
              <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-1">Location</span>
              <span className="font-sans text-sm font-semibold text-midnight">{news.location}</span>
            </div>
            <div>
              <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-1">Projected Opening</span>
              <span className="font-sans text-sm font-semibold text-midnight">{news.projectedOpening}</span>
            </div>
          </div>

          {renderedContent}
        </article>

        {/* Related Articles Section */}
        {relatedNews.length > 0 && (
          <section className="container" style={{ marginTop: 96 }}>
            <header className="section-head">
              <h2>Keep <em>reading</em></h2>
            </header>
            <div className="grid-3">
              {relatedNews.map((related) => (
                <Link key={related.slug} href={`/news/${related.slug}`} className="card-article">
                  <div className="card-article__media">
                    <img 
                      src={related.image} 
                      alt={related.propertyName} 
                      loading="lazy" 
                      className="w-full h-full object-cover"
                    />
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
