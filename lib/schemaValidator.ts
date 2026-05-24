export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates article frontmatter data and body markdown content against
 * Little Bit of Luxe's brand system and SEO guidelines.
 * 
 * @param type The article type ('review', 'news', 'program', 'general')
 * @param data The article metadata object (frontmatter)
 * @param content The article body content in markdown
 */
export function validateArticle(type: string, data: any, content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const title = (data.title || '').trim();
  const slug = (data.slug || '').trim();
  const excerpt = (data.excerpt || '').trim();
  const date = data.date;

  // --- GENERAL CHECKS ---
  
  // 1. Slug checks (Strict)
  if (!slug) {
    errors.push("URL Slug is required.");
  } else {
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
      errors.push("URL Slug is invalid. Only lowercase alphanumeric characters, hyphens, and underscores are allowed (no spaces or capital letters).");
    }
  }

  // 2. Title checks (Strict & Style Warnings)
  if (!title) {
    errors.push("Article Title is required.");
  } else {
    if (title.length < 10) {
      warnings.push("Title is very short (under 10 characters). Consider a more descriptive headline.");
    } else if (title.length > 100) {
      warnings.push("Title is too long (over 100 characters). For SEO benefit, keep titles concise.");
    }

    // Brand guideline: Italicize exactly one word/phrase per headline using asterisks
    const asterisksCount = (title.match(/\*/g) || []).length;
    if (asterisksCount === 0) {
      warnings.push("Brand Style: The title should contain exactly one word or phrase italicized with asterisks (e.g. A weekend at the *Splendido* that lived up to its name.) to match the journal's visual system.");
    } else if (asterisksCount % 2 !== 0) {
      errors.push("Formatting Error: Unmatched asterisk in the title (e.g. *Aman Venice). Verify your markdown syntax.");
    } else if (asterisksCount > 2) {
      warnings.push("Brand Style: Multiple italicized segments detected. The style guidelines suggest italicizing only one key, evocative word.");
    }
  }

  // 3. Date checks (Strict)
  if (!date) {
    errors.push("Publication Date is required.");
  } else {
    const parsedDate = Date.parse(date);
    if (isNaN(parsedDate)) {
      errors.push("Publication Date has an invalid format. Please provide a valid Date string.");
    }
  }

  // 4. Excerpt checks (Warnings)
  if (!excerpt) {
    errors.push("Excerpt (Summary) is required.");
  } else if (excerpt.length < 40 || excerpt.length > 300) {
    warnings.push("Excerpt should ideally be between 40 and 300 characters for optimal rendering inside cards and SEO tags.");
  }

  // 5. SEO Meta Description checks (Warnings)
  const metaDescription = (data.metaDescription || '').trim();
  if (metaDescription) {
    if (metaDescription.length < 100 || metaDescription.length > 160) {
      warnings.push(`SEO Warning: Meta Description length is ${metaDescription.length} characters. The optimal length for search engine result pages is 100-160 characters.`);
    }
  }

  // 6. Content Body checks (Strict SEO & Style Warnings)
  const normalizedContent = content || '';
  const bodyText = normalizedContent.trim();
  
  // Check for H1 headings in body
  const hasH1 = /(?:^|\n)#\s+.+/g.test(normalizedContent);
  if (hasH1) {
    errors.push("SEO Error: Heading 1 (# Heading) detected in the article body. The page title already acts as the H1 header. Adding H1 tags in the content creates duplicate headers, which harms search ranking. Use Heading 2 (##) or Heading 3 (###) instead.");
  }

  // Check for empty headings
  const hasEmptyHeadings = /(?:^|\n)#{2,4}\s*(?:\r?\n|$)/g.test(normalizedContent);
  if (hasEmptyHeadings) {
    errors.push("Formatting Error: Empty heading syntax (## or ### followed by no text) detected in the body content.");
  }

  // Check for placeholder links
  const hasPlaceholderLinks = /\[[^\]]*\]\(\s*#\s*\)/g.test(normalizedContent);
  if (hasPlaceholderLinks) {
    warnings.push("Style Warning: Placeholder links (referencing URL '#') detected in the content.");
  }

  // Word count check
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
  if (type === 'review') {
    if (wordCount < 600) {
      warnings.push(`Content Length: Review is only ${wordCount} words. High-end hotel reviews are recommended to be at least 600-1000 words to provide considered, detailed insight.`);
    }
  } else if (type === 'news') {
    if (wordCount < 250) {
      warnings.push(`Content Length: News post is only ${wordCount} words. Consider adding more context or brand vision detail.`);
    }
  } else if (bodyText.length === 0) {
    errors.push("Article body content cannot be completely empty.");
  }

  // --- TYPE-SPECIFIC CHECKS ---
  
  if (type === 'review') {
    const hotelName = (data.hotelName || '').trim();
    const brand = (data.brand || '').trim();
    const location = (data.location || '').trim();
    const roomType = (data.roomType || '').trim();
    const rating = data.rating;

    if (!hotelName) errors.push("Hotel Name is required for reviews.");
    if (!brand) errors.push("Hotel Brand is required for reviews.");
    if (!location) errors.push("Location (City, Country) is required for reviews.");
    if (!roomType) errors.push("Tested Room Type is required for reviews.");
    
    if (rating === undefined || rating === '') {
      errors.push("Star Rating is required.");
    } else {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        errors.push("Rating must be a number between 1.0 and 10.0.");
      }
    }

    // Editorial details in Verdict box
    const verdictHead = (data.verdictHead || '').trim();
    const verdictHighlight = (data.verdictHighlight || '').trim();
    if (!verdictHead) warnings.push("Editorial: 'Verdict Headline' is missing. This headline titles the signature Verdict card.");
    if (!verdictHighlight) warnings.push("Editorial: 'Verdict Key Highlight' is missing. This summaries the highlight line in the Verdict card.");
  } 
  
  else if (type === 'news') {
    const propertyName = (data.propertyName || data.property_name || '').trim();
    const brand = (data.brand || '').trim();
    const location = (data.location || '').trim();
    const projectedOpening = (data.projectedOpening || data.projected_opening || '').trim();

    if (!propertyName) errors.push("Property Name is required for news.");
    if (!brand) errors.push("Brand is required for news.");
    if (!location) errors.push("Location is required for news.");
    if (!projectedOpening) errors.push("Projected Opening Date/Quarter is required for news.");
    
    const sourceUrl = (data.sourceUrl || data.source_url || '').trim();
    const sources = data.sources || [];
    if (!sourceUrl && sources.length === 0) {
      warnings.push("Verification Cues: No external citation sources or reference URLs provided for this news announcement.");
    }
  } 
  
  else if (type === 'program') {
    const programName = (data.programName || data.program_name || '').trim();
    const loyaltyNetwork = (data.loyaltyNetwork || data.loyalty_network || '').trim();
    const brands = (data.brands || '').trim();

    if (!programName) errors.push("Program Name is required for partner guides.");
    if (!loyaltyNetwork) errors.push("Loyalty/Hotel Network is required for partner guides.");
    if (!brands) errors.push("Participating Brands list is required for partner guides.");
  } 
  
  else if (type === 'general') {
    const tldr = (data.tldr || '').trim();
    if (!tldr) {
      warnings.push("Brand Style: General articles should ideally feature a TL;DR summary block at the top.");
    } else {
      const bulletsCount = (tldr.match(/^\s*-\s+/gm) || []).length;
      if (bulletsCount === 0) {
        warnings.push("Formatting: TL;DR content should be formatted as bullet points (using hyphens, e.g. - Bullet 1).");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
