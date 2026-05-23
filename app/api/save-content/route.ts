import { NextRequest, NextResponse } from 'next/server';
import { saveContentToGithub, deleteContentFromGithub } from '@/lib/github';
import fs from 'fs';
import path from 'path';

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
      oldType,
      oldSlug,
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
      draft,
      status,
      sources,
      galleryStyle,
      tldr,
      verdictHead,
      verdictHighlight,
      verdictBestFor,
      verdictScore
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

    // Handle renaming / moving articles if type or slug changes
    if (oldType && oldSlug && (oldType !== type || oldSlug !== slug)) {
      let oldSubfolder = 'programs';
      if (oldType === 'review') {
        oldSubfolder = 'reviews';
      } else if (oldType === 'news') {
        oldSubfolder = 'news';
      }
      const oldRelPath = `content/${oldSubfolder}/${oldSlug}.md`;
      const oldLocalPath = path.join(process.cwd(), oldRelPath);

      if (fs.existsSync(oldLocalPath)) {
        try {
          fs.unlinkSync(oldLocalPath);
        } catch (localDelErr: any) {
          console.warn('Failed to delete old file locally (read-only filesystem):', localDelErr.message);
        }
      }

      try {
        await deleteContentFromGithub(oldRelPath, `Delete old file during category/slug change to ${type}: ${slug}`);
      } catch (delErr) {
        console.error('Failed to delete old file from GitHub:', delErr);
      }
    }


    // Resolve initial status and draft status
    const finalStatus = status || (draft === true ? 'draft' : 'published');
    const finalDraft = finalStatus !== 'published';

    // Build the frontmatter object based on type
    const frontmatter: Record<string, any> = {
      title: title || '',
      excerpt: excerpt || '',
      date: date || new Date().toISOString(),
      category: category || (type === 'program' ? 'Preferred Partner' : type === 'news' ? 'Hotel News' : 'Hotel Review'),
      draft: finalDraft,
      status: finalStatus,
      sources: sources || [],
      galleryStyle: galleryStyle || 'grid',
      tldr: tldr || '',
      partnerLink: partnerLink || '',
    };

    if (type === 'program') {
      frontmatter.programName = programName || '';
      frontmatter.loyaltyNetwork = loyaltyNetwork || 'Independent';
      frontmatter.brands = brands || '';
      frontmatter.officialLink = officialLink || '';
      frontmatter.image = ogImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';
      if (verdictBestFor || verdictHighlight || verdictScore) {
        frontmatter.verdict = {
          best_for: verdictBestFor || '',
          highlight: verdictHighlight || '',
          score: verdictScore !== undefined && verdictScore !== '' ? Number(verdictScore) : ''
        };
      }
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
      frontmatter.image = ogImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
      frontmatter.verdictHead = verdictHead || '';
      frontmatter.verdictHighlight = verdictHighlight || '';
    }

    // Serialize frontmatter using gray-matter style block
    const yamlLines = ['---'];
    Object.entries(frontmatter).forEach(([key, val]) => {
      if (typeof val === 'string') {
        // Escape quotes
        const cleanVal = val.replace(/"/g, '\\"');
        yamlLines.push(`${key}: "${cleanVal}"`);
      } else if (Array.isArray(val)) {
        yamlLines.push(`${key}:`);
        val.forEach((item) => {
          const cleanItem = String(item).replace(/"/g, '\\"');
          yamlLines.push(`  - "${cleanItem}"`);
        });
      } else if (typeof val === 'object' && val !== null) {
        yamlLines.push(`${key}:`);
        Object.entries(val).forEach(([subKey, subVal]) => {
          const cleanSubVal = String(subVal).replace(/"/g, '\\"');
          if (typeof subVal === 'number' || typeof subVal === 'boolean') {
            yamlLines.push(`  ${subKey}: ${subVal}`);
          } else {
            yamlLines.push(`  ${subKey}: "${cleanSubVal}"`);
          }
        });
      } else {
        yamlLines.push(`${key}: ${val}`);
      }
    });
    yamlLines.push('---');
    yamlLines.push('');
    
    // Clean up content block wrapping (remove starting newlines)
    const bodyContent = content ? content.trim() : '';
    const fileContents = `${yamlLines.join('\n')}\n${bodyContent}`;

    // Write content locally
    try {
      const localPath = path.join(process.cwd(), relPath);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, fileContents, 'utf-8');
    } catch (localWriteErr: any) {
      console.warn('Failed to write file locally (read-only filesystem):', localWriteErr.message);
    }

    await saveContentToGithub(relPath, fileContents, `Update ${type}: ${slug}`);

    return NextResponse.json({ success: true, path: relPath });
  } catch (error: any) {
    console.error('Error saving content:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
