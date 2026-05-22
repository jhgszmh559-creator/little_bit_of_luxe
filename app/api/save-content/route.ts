import { NextRequest, NextResponse } from 'next/server';
import { saveContentToGithub } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
      return NextResponse.json({ error: "GITHUB_ACCESS_TOKEN is not configured. Please add it to your platform deployment environment variables." }, { status: 500 });
    }
    const data = await request.json();
    const { 
      type, 
      slug, 
      content,
      // Frontmatter fields
      title,
      excerpt,
      hotelName,
      propertyName,
      programName,
      loyaltyNetwork,
      brands,
      brand,
      location,
      rating,
      roomType,
      youtubeId,
      showQxPerks,
      metaTitle,
      metaDescription,
      ogImage,
      officialLink,
      partnerLink,
      projectedOpening,
      earlyNewsletterCta,
      sourceUrl,
      date,
      category,
      draft 
    } = data;

    if (!type || !slug) {
      return NextResponse.json({ error: 'Missing type or slug parameter' }, { status: 400 });
    }

    // Determine target directory and filename
    let subfolder = 'programs';
    if (type === 'review') {
      subfolder = 'reviews';
    } else if (type === 'news') {
      subfolder = 'news';
    }
    const relPath = `content/${subfolder}/${slug}.md`;

    // Build the frontmatter object based on type
    const frontmatter: Record<string, any> = {
      title: title || '',
      excerpt: excerpt || '',
      date: date || new Date().toISOString().split('T')[0],
      category: category || (type === 'program' ? 'Preferred Partner' : type === 'news' ? 'Hotel News' : 'Hotel Review'),
      draft: draft !== undefined ? !!draft : false,
    };

    if (type === 'program') {
      frontmatter.programName = programName || '';
      frontmatter.loyaltyNetwork = loyaltyNetwork || 'Independent';
      frontmatter.brands = brands || '';
      frontmatter.officialLink = officialLink || '';
      frontmatter.partnerLink = partnerLink || '';
      frontmatter.image = ogImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';
    } else if (type === 'news') {
      frontmatter.brand = brand || '';
      frontmatter.property_name = propertyName || '';
      frontmatter.location = location || '';
      frontmatter.projected_opening = projectedOpening || '';
      frontmatter.early_newsletter_cta = earlyNewsletterCta !== false;
      frontmatter.source_url = sourceUrl || '';
      frontmatter.image = ogImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';
    } else {
      frontmatter.hotelName = hotelName || '';
      frontmatter.brand = brand || '';
      frontmatter.location = location || '';
      frontmatter.rating = Number(rating) || 9.0;
      frontmatter.roomType = roomType || '';
      frontmatter.youtubeId = youtubeId || '';
      frontmatter.showQxPerks = showQxPerks !== false;
      frontmatter.metaTitle = metaTitle || '';
      frontmatter.metaDescription = metaDescription || '';
      frontmatter.ogImage = ogImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
    }

    // Serialize frontmatter using gray-matter style block
    const yamlLines = ['---'];
    Object.entries(frontmatter).forEach(([key, val]) => {
      if (typeof val === 'string') {
        // Escape quotes
        const cleanVal = val.replace(/"/g, '\\"');
        yamlLines.push(`${key}: "${cleanVal}"`);
      } else {
        yamlLines.push(`${key}: ${val}`);
      }
    });
    yamlLines.push('---');
    yamlLines.push('');
    
    // Clean up content block wrapping (remove starting newlines)
    const bodyContent = content ? content.trim() : '';
    const fileContents = `${yamlLines.join('\n')}\n${bodyContent}`;

    await saveContentToGithub(relPath, fileContents, `Update ${type}: ${slug}`);

    return NextResponse.json({ success: true, path: relPath });
  } catch (error: any) {
    console.error('Error saving content:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
