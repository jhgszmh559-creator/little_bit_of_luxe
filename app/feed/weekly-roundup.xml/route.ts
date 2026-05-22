import { NextResponse } from 'next/server';
import { getPrograms, getReviews } from '@/lib/content';

export async function GET() {
  const programs = getPrograms();
  const reviews = getReviews().filter(r => !r.draft);

  // Combine and sort by date
  const allItems = [
    ...programs.map(p => ({
      title: p.title,
      link: `https://littlebitofluxe.com/program/${p.slug}`,
      description: p.excerpt,
      pubDate: new Date(p.date).toUTCString(),
      image: p.image,
      category: p.category,
    })),
    ...reviews.map(r => ({
      title: r.title,
      link: `https://littlebitofluxe.com/review/${r.slug}`,
      description: r.excerpt,
      pubDate: new Date(r.date).toUTCString(),
      image: r.ogImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      category: r.category,
    })),
  ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const rssItemsXml = allItems
    .map(item => {
      return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <category><![CDATA[${item.category}]]></category>
      <enclosure url="${item.image}" length="0" type="image/jpeg" />
      <media:content url="${item.image}" type="image/jpeg" medium="image">
        <media:title type="plain"><![CDATA[${item.title}]]></media:title>
      </media:content>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/" 
  xmlns:wfw="http://wellformedweb.org/CommentAPI/" 
  xmlns:dc="http://purl.org/dc/elements/1.1/" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/" 
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Little Bit of Luxe</title>
    <atom:link href="https://littlebitofluxe.com/feed/weekly-roundup.xml" rel="self" type="application/rss+xml" />
    <link>https://littlebitofluxe.com</link>
    <description>A travel journal for the kind of places worth going slowly.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-US</language>
    <sy:updatePeriod>weekly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <image>
      <url>https://littlebitofluxe.com/logos/Littlebitofluxe%20dark%20blue.png</url>
      <title>Little Bit of Luxe</title>
      <link>https://littlebitofluxe.com</link>
    </image>
    ${rssItemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
    },
  });
}
