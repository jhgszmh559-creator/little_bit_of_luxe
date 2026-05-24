'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Save, 
  BookOpen, 
  Settings, 
  Sun, 
  Moon,
  Bold,
  Italic,
  Underline,
  Palette,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  Link2,
  ExternalLink,
  Sparkles,
  Layers,
  BookOpenCheck,
  Eye
} from 'lucide-react';
import { parseMarkdown } from '@/lib/markdown';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { validateArticle } from '@/lib/schemaValidator';



interface ArticleItem {
  title: string;
  slug: string;
  category: string;
  type: 'program' | 'review' | 'news' | 'general';
}

interface EditorFormProps {
  type: 'review' | 'program' | 'news' | 'general';
  slug: string;
  initialData: any;
  allArticles?: ArticleItem[];
}

const formatDatetimeLocal = (isoString: string) => {
  try {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const BRAND_COLORS = [
  { name: 'Midnight', hex: '#0D152D', bgClass: 'bg-[#0D152D]' },
  { name: 'Sand', hex: '#F4F1D3', bgClass: 'bg-[#F4F1D3] text-midnight' },
  { name: 'Bordeaux', hex: '#6B1F2A', bgClass: 'bg-[#6B1F2A]' },
  { name: 'Sage', hex: '#6F7A5C', bgClass: 'bg-[#6F7A5C]' },
  { name: 'Terracotta', hex: '#B96A4A', bgClass: 'bg-[#B96A4A]' },
  { name: 'Gold', hex: '#B08442', bgClass: 'bg-[#B08442]' },
  { name: 'Paper', hex: '#FAF8F2', bgClass: 'bg-[#FAF8F2] text-midnight border border-ink/10' },
  { name: 'Paper 2', hex: '#F0ECE0', bgClass: 'bg-[#F0ECE0] text-midnight' },
  { name: 'Ivory', hex: '#FFFFFF', bgClass: 'bg-white text-midnight border border-ink/10' },
];

function nodeToMarkdown(node: Node): string {
  let result = '';
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    
    // Check if it's a specific custom block we preserve as raw HTML
    const isCustomBlock = tagName === 'div' || tagName === 'figure' || tagName === 'figcaption' || tagName === 'iframe' || tagName === 'video' || tagName === 'aside' || tagName === 'dl' || tagName === 'dt' || tagName === 'dd';
    
    if (isCustomBlock) {
      let html = element.outerHTML.trim();
      // Replace class="..." with className="..." inside the HTML string to maintain consistency with the JSX markdown style
      html = html.replace(/\bclass=/g, 'className=');
      return '\n\n' + html + '\n\n';
    }
    
    let childrenMarkdown = '';
    element.childNodes.forEach(child => {
      childrenMarkdown += nodeToMarkdown(child);
    });
    
    switch (tagName) {
      case 'h1':
        return `\n\n# ${childrenMarkdown.trim()}\n\n`;
      case 'h2':
        return `\n\n## ${childrenMarkdown.trim()}\n\n`;
      case 'h3':
        return `\n\n### ${childrenMarkdown.trim()}\n\n`;
      case 'p':
        return `\n\n${childrenMarkdown.trim()}\n\n`;
      case 'img':
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        return `\n\n![${alt}](${src})\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenMarkdown}**`;
      case 'em':
      case 'i':
        return `*${childrenMarkdown}*`;
      case 'u':
        return `<u>${childrenMarkdown}</u>`;
      case 'a':
        const href = element.getAttribute('href') || '';
        const aClass = element.getAttribute('class');
        const target = element.getAttribute('target');
        const rel = element.getAttribute('rel');
        if (aClass || target || rel) {
          let attrs = `href="${href}"`;
          if (aClass) attrs += ` class="${aClass}"`;
          if (target) attrs += ` target="${target}"`;
          if (rel) attrs += ` rel="${rel}"`;
          return `<a ${attrs}>${childrenMarkdown}</a>`;
        }
        return `[${childrenMarkdown}](${href})`;
      case 'span':
        const styleColor = element.style.color;
        const styleFontFamily = element.style.fontFamily;
        const styleFontSize = element.style.fontSize;
        
        let styleStr = '';
        if (styleColor) styleStr += `color: ${styleColor}; `;
        if (styleFontFamily) styleStr += `font-family: ${styleFontFamily}; `;
        if (styleFontSize) styleStr += `font-size: ${styleFontSize}; `;
        
        if (styleStr) {
          return `<span style="${styleStr.trim()}">${childrenMarkdown}</span>`;
        }
        return childrenMarkdown;
      case 'font':
        const colorAttr = element.getAttribute('color');
        const faceAttr = element.getAttribute('face');
        if (colorAttr && faceAttr) {
          return `<span style="color: ${colorAttr}; font-family: ${faceAttr}">${childrenMarkdown}</span>`;
        }
        if (colorAttr) {
          return `<span style="color: ${colorAttr}">${childrenMarkdown}</span>`;
        }
        if (faceAttr) {
          return `<span style="font-family: ${faceAttr}">${childrenMarkdown}</span>`;
        }
        return childrenMarkdown;
      case 'br':
        return '\n';
      case 'ol':
        // Number each child <li> sequentially
        let olResult = '\n\n';
        let liIndex = 1;
        element.childNodes.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
            const liContent = nodeToMarkdown(child);
            // Strip the leading '- ' that the li case adds and replace with numbered prefix
            const stripped = liContent.replace(/^- /, '');
            olResult += `${liIndex}. ${stripped}`;
            liIndex++;
          }
        });
        return olResult + '\n';
      case 'ul':
        return `\n\n${childrenMarkdown}\n\n`;
      case 'li': {
        // Collect child content, but if children are wrapped in <p> tags, flatten them
        let liText = '';
        element.childNodes.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'p') {
            // Flatten <p> inside <li> — don't add paragraph breaks
            let pContent = '';
            child.childNodes.forEach(pc => { pContent += nodeToMarkdown(pc); });
            liText += pContent.trim();
          } else {
            liText += nodeToMarkdown(child);
          }
        });
        return `- ${liText.trim()}\n`;
      }
      default:
        return childrenMarkdown;
    }
  }
  return result;
}

function convertHtmlToMarkdown(html: string): string {
  if (typeof window === 'undefined') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const markdown = nodeToMarkdown(doc.body);
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

export default function EditorForm({ type, slug: initialSlug, initialData, allArticles = [] }: EditorFormProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<any>(null);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Form State
  const [slug, setSlug] = useState(initialSlug || '');
  const [currentType, setCurrentType] = useState(type);
  const [title, setTitle] = useState(initialData?.title || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || (currentType === 'program' ? 'Preferred Partner' : currentType === 'news' ? 'Hotel News' : currentType === 'general' ? 'Travel News' : 'Hotel Review'));
  const [draft, setDraft] = useState(initialData?.draft !== undefined ? initialData.draft : true);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString());

  // Review specific fields
  const [hotelName, setHotelName] = useState(initialData?.hotelName || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [rating, setRating] = useState(initialData?.rating || 9.0);
  const [roomType, setRoomType] = useState(initialData?.roomType || '');
  const [youtubeId, setYoutubeId] = useState(initialData?.youtubeId || '');
  const [showQxPerks, setShowQxPerks] = useState(initialData?.showQxPerks !== false);

  // Program specific fields
  const [programName, setProgramName] = useState(initialData?.programName || '');
  const [loyaltyNetwork, setLoyaltyNetwork] = useState(initialData?.loyaltyNetwork || 'Independent');
  const [brands, setBrands] = useState(initialData?.brands || '');
  const [officialLink, setOfficialLink] = useState(initialData?.officialLink || '');
  const [partnerLink, setPartnerLink] = useState(initialData?.partnerLink || '');
  const defaultHero = "https://cdn.prod.website-files.com/678444b2dafe38769d2ef04e/6895092d01a98987f2bbc29e_Light%20Gradient%2007.avif";
  const [ogImage, setOgImage] = useState(initialData?.image || initialData?.ogImage || defaultHero);
  const [heroVideo, setHeroVideo] = useState(initialData?.heroVideo || '');
  const [heroCaption, setHeroCaption] = useState(initialData?.heroCaption || '');
  const [galleryStyle, setGalleryStyle] = useState(initialData?.galleryStyle || 'grid');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // News specific fields
  const [propertyName, setPropertyName] = useState(initialData?.propertyName || '');
  const [projectedOpening, setProjectedOpening] = useState(initialData?.projectedOpening || '');
  const [earlyNewsletterCta, setEarlyNewsletterCta] = useState(initialData?.earlyNewsletterCta !== false);
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');

  // Editorial Box fields
  const [tldr, setTldr] = useState(initialData?.tldr || '');
  const [verdictHead, setVerdictHead] = useState(initialData?.verdictHead || 'A considered residency *inspected*');
  const [verdictHighlight, setVerdictHighlight] = useState(initialData?.verdictHighlight || 'Exceptional architecture and local integration');
  const [verdictBestFor, setVerdictBestFor] = useState(initialData?.verdictBestFor || '');
  const [verdictScore, setVerdictScore] = useState(initialData?.verdictScore || '');

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'design' | 'editorial' | 'preview' | 'quality'>('write');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] }>({ isValid: true, errors: [], warnings: [] });

  useEffect(() => {
    const payload = {
      title,
      slug,
      excerpt,
      date,
      category,
      hotelName,
      brand,
      location,
      rating,
      roomType,
      verdictHead,
      verdictHighlight,
      propertyName,
      projectedOpening,
      sourceUrl,
      programName,
      loyaltyNetwork,
      brands,
      tldr
    };
    const result = validateArticle(currentType, payload, content || '');
    setValidation(result);
  }, [
    title, slug, excerpt, date, category, currentType, content,
    hotelName, brand, location, rating, roomType, verdictHead, verdictHighlight,
    propertyName, projectedOpening, sourceUrl,
    programName, loyaltyNetwork, brands,
    tldr
  ]);



  // Lifecycle & Citations State
  const [status, setStatus] = useState<'published' | 'draft' | 'needs_review' | 'scheduled' | 'archived'>(initialData?.status || (initialData?.draft === false ? 'published' : 'draft'));
  const [sources, setSources] = useState<string[]>(initialData?.sources || []);

  // Rich Text Toolbars & Popups State
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [hyperlinkUrl, setHyperlinkUrl] = useState('');
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  
  // Cloudinary Loader Modal State
  const [cloudinaryOpen, setCloudinaryOpen] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [cloudinaryCaption, setCloudinaryCaption] = useState('');

  // Video Loader Modal State
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // SEO Sidebar & Keyword Suggestions State
  const [targetKeyword, setTargetKeyword] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState<Array<{ context: string; suggestion: string }>>([]);
  const [analyzingKeyword, setAnalyzingKeyword] = useState(false);

  // New GEO & SEO Toggles
  const [geoPassed, setGeoPassed] = useState(false);
  const [altTextOptimized, setAltTextOptimized] = useState(false);
  const [entityDensity, setEntityDensity] = useState(false);
  const [citationReadiness, setCitationReadiness] = useState(false);
  const [directAnswerFormatting, setDirectAnswerFormatting] = useState(false);

    // AI Summary Generator
  const generateSummary = async () => {
    if (!content) return;
    setIsGeneratingSummary(true);
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const data = await res.json();
        setExcerpt(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };



  // Gemini keyword insertion suggestions utility route call
  const analyzeKeywordInsertion = async () => {
    if (!targetKeyword || !content) return;
    setAnalyzingKeyword(true);
    setKeywordSuggestions([]);
    try {
      const res = await fetch('/api/analyze-keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keyword: targetKeyword }),
      });
      if (res.ok) {
        const data = await res.json();
        setKeywordSuggestions(data.suggestions || []);
      } else {
        console.error('Failed to analyze keyword');
      }
    } catch (err) {
      console.error('Error analyzing keyword:', err);
    } finally {
      setAnalyzingKeyword(false);
    }
  };

  // Automated On-Page SEO Checks
  const isSingleH1 = () => {
    if (!content) return false;
    const h1Count = (content.match(/^#\s+.+$/gm) || []).length;
    return h1Count === 1;
  };

  const noSkippedHeadings = () => {
    if (!content) return true;
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    let prevLevel = 1; // Assuming title is H1
    for (const heading of headings) {
      const level = heading.match(/^#{1,6}/)?.[0].length || 1;
      if (level > prevLevel + 1) return false;
      prevLevel = level;
    }
    return true;
  };
  
  const internalLinksPresent = () => {
    if (!content) return false;
    return content.includes('](/') || content.includes('href="/') || content.includes('href=\\"/');
  };

  const handleSave = async (overrideStatus?: 'published' | 'draft' | 'needs_review' | 'scheduled' | 'archived', e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!slug) {
      alert('Please provide a unique URL slug.');
      return;
    }

    // Run frontmatter & body validations before saving
    const currentStatus = overrideStatus || status;
    const validationPayload = {
      title,
      slug,
      excerpt,
      date,
      category,
      hotelName,
      brand,
      location,
      rating,
      roomType,
      verdictHead,
      verdictHighlight,
      propertyName,
      projectedOpening,
      sourceUrl,
      programName,
      loyaltyNetwork,
      brands,
      tldr
    };
    
    const valResult = validateArticle(currentType, validationPayload, content || '');
    if (!valResult.isValid) {
      setSaving(false);
      setEditorTab('quality');
      setMessage('Quality Check Error: Please resolve all blocking errors listed on the Quality tab before saving.');
      return;
    }

    setSaving(true);

    setMessage('');

    if (overrideStatus && overrideStatus !== status) {
      setStatus(overrideStatus);
    }

    const payload = {
      type: currentType,
      slug,
      oldType: type,
      oldSlug: initialSlug,
      title,
      excerpt,
      content,
      category,
      draft: currentStatus !== 'published',
      status: currentStatus,
      sources,
      date,
      // Review specific
      hotelName,
      brand,
      location,
      rating,
      roomType,
      youtubeId,
      showQxPerks,
      // Program specific
      programName,
      loyaltyNetwork,
      brands,
      officialLink,
      partnerLink,
      ogImage,
      heroVideo,
      heroCaption,
      // News specific
      propertyName,
      projectedOpening,
      earlyNewsletterCta,
      sourceUrl,
      // New custom metadata fields
      galleryStyle,
      tldr,
      verdictHead,
      verdictHighlight,
      verdictBestFor,
      verdictScore,
    };

    try {
      const response = await fetch('/api/save-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (response.ok) {
        setMessage('Draft saved successfully.');
        if (currentType !== type || slug !== initialSlug) {
          router.push(`/admin/editor?type=${currentType}&slug=${slug}`);
        } else {
          router.refresh();
        }
      } else {
        setMessage(`Error: ${resData.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      setMessage(`Save failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const autoGenerateSlug = () => {
    const text = currentType === 'program' ? programName : currentType === 'news' ? propertyName : currentType === 'general' ? title : hotelName;
    if (text) {
      const slugified = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(slugified);
    }
  };

  // SEO Helper Calculations
  const getWordCount = () => {
    return content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  };

  const getCharCount = () => {
    return content ? content.length : 0;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    return Math.ceil(words / 200) || 1;
  };

  // Focus Keyword Density Tracker
  const isKeywordInTitle = () => {
    if (!targetKeyword) return false;
    return title.toLowerCase().includes(targetKeyword.toLowerCase());
  };

  const isKeywordInExcerpt = () => {
    if (!targetKeyword) return false;
    return excerpt.toLowerCase().includes(targetKeyword.toLowerCase());
  };

  const getKeywordDensity = () => {
    if (!targetKeyword || !content) return 0;
    const cleanKeyword = targetKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${cleanKeyword}\\b`, 'gi');
    const matches = content.match(regex);
    const words = getWordCount();
    if (words === 0) return 0;
    const count = matches ? matches.length : 0;
    return parseFloat(((count / words) * 100).toFixed(2));
  };

  // Dynamic Internal Link Suggester
  const getSuggestedLinks = () => {
    if (!title) {
      return [];
    }

    // Split title into lowercase descriptive tokens (filtering common filler words)
    const stopWords = new Set(['the', 'and', 'with', 'that', 'this', 'for', 'hotel', 'review', 'news', 'preferred', 'partner', 'about', 'from', 'your', 'guide', 'luxe', 'little', 'a', 'an', 'at', 'in', 'on', 'of', 'to']);
    const tokens = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/[\s-]+/)
      .filter((token: string) => token.length > 2 && !stopWords.has(token));

    if (tokens.length === 0) {
      return [];
    }

    const scored = allArticles
      .filter(article => article.slug !== initialSlug)
      .map(article => {
        let score = 0;
        const articleText = (article.title + ' ' + article.category + ' ' + article.slug).toLowerCase();
        
        tokens.forEach((token: string) => {
          if (articleText.includes(token)) {
            score += 1;
          }
        });
        
        return { article, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.article);

    return scored.slice(0, 4);
  };

  const getArticleUrl = (article: ArticleItem) => {
    if (article.type === 'review') return `/review/${article.slug}`;
    if (article.type === 'news') return `/news/${article.slug}`;
    return `/program/${article.slug}`;
  };

  const handleInsertLink = (article: ArticleItem) => {
    const relativeUrl = getArticleUrl(article);
    const linkHtml = `<a href="${relativeUrl}">${article.title}</a>`;
    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.insertContent(linkHtml);
    } else {
      setContent((prev: string) => prev + '\n\n' + `[${article.title}](${relativeUrl})`);
    }
  };

  const handleInsertVerdict = () => {
    const scoreStr = (Number(rating) || 9.0).toFixed(1);
    const [whole, decimal] = scoreStr.split('.');
    const html = `<aside class="verdict"><div><div class="verdict__eyebrow">The Verdict</div><div class="verdict__head">A considered residency <em>inspected</em></div><dl class="verdict__rows"><dt class="k">Hotel</dt><dd style="margin: 0;">${hotelName || '[Hotel Name]'}</dd><dt class="k">Tested Room</dt><dd style="margin: 0;">${roomType || '[Tested Room Type]'}</dd><dt class="k">Key Highlight</dt><dd style="margin: 0;">Exceptional architecture and local integration</dd></dl></div><div class="verdict__score"><div class="verdict__num">${whole}.<em>${decimal || '0'}</em></div><div class="verdict__den">/ 10</div></div></aside>`;
    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.insertContent(html);
    } else {
      setContent((prev: string) => prev + '\n\n' + html);
    }
  };

  const handleInsertQxPerks = () => {
    const html = `<div class="article-cta-box"><p class="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p><h3 class="lbl-h3 mb-4">Book ${hotelName || '[Hotel Name]'} with Perks</h3><p class="lbl-body mb-6">Through our preferred partnerships, we unlock daily breakfast, priority upgrades, and property credits for standard direct bookings.</p><a href="https://www.qxtravel.io/search-hotels" target="_blank" rel="noopener noreferrer" class="btn-subscribe">Book with Perks <span class="btn-subscribe__arrow">→</span></a></div>`;
    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.insertContent(html);
    } else {
      setContent((prev: string) => prev + '\n\n' + html);
    }
  };

  const handleInsertTldr = () => {
    const html = `<div class="tldr-box"><h4 class="tldr-box__title">The TL;DR</h4><ul class="tldr-box__list"><li>[Key takeaway point one]</li><li>[Key takeaway point two]</li><li>[Key takeaway point three]</li></ul></div>`;
    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.insertContent(html);
    } else {
      setContent((prev: string) => prev + '\n\n' + html);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-ink transition-colors selection:bg-sand selection:text-midnight">
      
      {/* Editor Top Bar */}
      <header className="bg-card text-ink py-4 px-6 md:px-12 flex items-center justify-between border-b border-ink/10 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin" 
            className="text-ink/70 hover:text-ink flex items-center gap-1.5 text-xs uppercase tracking-wider p-2 min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" /> Back to CMS
          </Link>
          <span className="text-ink/30 font-light">|</span>
          <span className="text-xs uppercase tracking-widest font-semibold font-sans">
            {initialSlug ? `Edit ${type}` : `New ${type}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 border border-ink/15 hover:border-ink/30 text-ink rounded-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Theme toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-3 font-sans">Status:</span>
            <select
              value={status}
              onChange={e => {
                const nextStatus = e.target.value as any;
                setStatus(nextStatus);
              }}
              className="text-xs bg-card border border-ink/15 px-3 py-2 outline-none focus:border-ink text-ink rounded-none font-sans font-semibold uppercase tracking-wider min-h-[44px]"
            >
              <option value="draft">Draft</option>
              <option value="needs_review">Needs Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => handleSave(status)}
            disabled={saving}
            className="btn--sand text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 font-sans tracking-widest uppercase font-semibold border border-midnight rounded-none"
          >
            <Save className="w-4 h-4" /> 
            {saving ? 'Saving...' : (
              status === 'published' ? 'Publish' :
              status === 'scheduled' ? 'Schedule' :
              status === 'needs_review' ? 'Submit Review' :
              status === 'archived' ? 'Archive' : 'Save Draft'
            )}
          </button>
          
          {status === 'scheduled' && new Date(date) <= new Date() && (
            <span className="text-[9px] text-bordeaux font-sans uppercase font-bold tracking-wider max-w-[120px] text-right leading-tight">
              Note: Date is in past, will be live
            </span>
          )}
        </div>
      </header>

      {/* Message Banner */}
      {message && (
        <div className={`text-center py-3 px-6 text-xs uppercase tracking-wider font-semibold ${
          message.includes('successfully') ? 'bg-sage/10 text-sage border-b border-sage/20' : 'bg-bordeaux/10 text-bordeaux border-b border-bordeaux/20'
        }`}>
          {message}
        </div>
      )}

      {/* Workspace Wrapper */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Segmented Editor Tabs */}
        <div className="flex bg-card border border-ink/10 p-1 rounded-none shadow-sm max-w-[900px] mx-auto w-full">
          <button
            onClick={() => setEditorTab('write')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
              editorTab === 'write' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Write
          </button>
          <button
            onClick={() => setEditorTab('design')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
              editorTab === 'design' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Design & Media
          </button>
          <button
            onClick={() => setEditorTab('editorial')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
              editorTab === 'editorial' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <Settings className="w-4 h-4" /> Editorial Boxes
          </button>
          <button
            onClick={() => setEditorTab('preview')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
              editorTab === 'preview' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <Eye className="w-4 h-4" /> Live Preview
          </button>
          <button
            onClick={() => setEditorTab('quality')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer relative ${
              editorTab === 'quality' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" /> 
            <span>Quality Check</span>
            {validation.errors.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-bordeaux text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {validation.errors.length}
              </span>
            )}
            {validation.errors.length === 0 && validation.warnings.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                {validation.warnings.length}
              </span>
            )}
          </button>
        </div>


        {/* Dynamic Split Layout */}
        <div className="flex-grow">
          
          {editorTab === 'write' && (
            <div className="flex flex-col lg:flex-row gap-6 max-w-[1280px] w-full mx-auto items-start">
              {/* Main Content Column */}
              <div className="flex-grow lg:max-w-[800px] w-full flex flex-col gap-6 bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-none">
                
                {/* Article Title Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold font-sans">
                    Article Title
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. A weekend at the Splendido that lived up to its name."
                    className="w-full text-lg md:text-2xl font-serif bg-transparent border border-ink/15 p-4 outline-none focus:border-ink text-ink rounded-none min-h-[52px]"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Excerpt / Summary Field */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold font-sans">
                      Short Excerpt / Summary (Shows on homepage & newsletters)
                    </label>
                    <button type="button" onClick={generateSummary} disabled={isGeneratingSummary} className="text-[10px] uppercase tracking-wider text-bordeaux dark:text-gold-soft hover:underline flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {isGeneratingSummary ? 'Generating...' : 'AI Summary'}
                    </button>
                  </div>
                  <textarea 
                    rows={2}
                    placeholder="One elegant, poetic, serif italic sentence setting the scene."
                    className="w-full text-sm font-serif italic bg-transparent border border-ink/15 p-4 outline-none focus:border-ink text-ink rounded-none resize-none"
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    required
                  />
                </div>

                {/* Main Body Content Field */}
                <div className="flex flex-col gap-2 relative border border-ink/15">
                  <div className="bg-card px-4 py-2 border-b border-ink/10 text-[10px] tracking-wider uppercase text-ink-3 font-semibold font-sans flex justify-between items-center">
                    <span>Main Body Canvas</span>
                    <span className="text-ink-3/50">TipTap Editor Active</span>
                  </div>
                  
                  <div className="bg-transparent relative">
                    <SimpleEditor 
                      content={parseMarkdown(content)} 
                      onUpdate={(html) => setContent(convertHtmlToMarkdown(html))} 
                      onEditorReady={(editor) => {
                        editorInstanceRef.current = editor;
                      }}
                      onInsertCloudinary={() => setCloudinaryOpen(true)}
                      onInsertVideo={() => setVideoOpen(true)}
                      onInsertGallery={() => {
                        const html = `<div class="gallery gallery-${galleryStyle}">[Gallery Placeholder]</div>`;
                        if (editorInstanceRef.current) {
                          editorInstanceRef.current.commands.insertContent(html);
                        } else {
                          setContent((prev: string) => prev + '\n\n' + html);
                        }
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: SEO Strategy Sidebar */}
              <aside className="w-full lg:w-[380px] lg:sticky lg:top-[120px] bg-card border border-ink/10 p-6 shadow-sm rounded-none flex flex-col gap-6 self-start">
                <div className="border-b border-ink/10 pb-4">
                  <h4 className="font-serif text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-bordeaux dark:text-gold-soft" />
                    Strategy & SEO Hub
                  </h4>
                  <p className="text-[10px] text-ink-3 uppercase tracking-wider mt-1">Real-time content scoring</p>
                </div>

                {/* Focus Keyword Section */}
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Target Keyword</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Splendido Hotel" 
                    value={targetKeyword}
                    onChange={e => setTargetKeyword(e.target.value)}
                    className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                  />
                </div>

                {/* On-Page SEO Checklist */}
                <div className="bg-paper/40 p-4 border border-ink/5 flex flex-col gap-3 text-xs">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold mb-1">On-Page Automated Checks</div>
                  
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">Exactly One H1 Tag</span>
                    {isSingleH1() ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">— No</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">No Skipped Heading Levels</span>
                    {noSkippedHeadings() ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">— No</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">Title Length Optimal (40-60)</span>
                    {title.length >= 40 && title.length <= 60 ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">{title.length} chars</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">Excerpt Length Optimal (120-160)</span>
                    {excerpt.length >= 120 && excerpt.length <= 160 ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">{excerpt.length} chars</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">Content Length (&gt;800 words)</span>
                    {getWordCount() > 800 ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">{getWordCount()} words</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                    <span className="text-ink-2 font-medium">Internal Links Present</span>
                    {internalLinksPresent() ? (
                      <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                    ) : (
                      <span className="text-bordeaux font-medium">— No</span>
                    )}
                  </div>

                  {currentType === 'review' && (
                    <>
                      <div className="flex items-center justify-between border-b border-ink/5 pb-2">
                        <span className="text-ink-2 font-medium">Verdict Box Configured</span>
                        {tldr || rating || verdictHead || verdictHighlight ? (
                          <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                        ) : (
                          <span className="text-bordeaux font-medium">— Missing</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-2 font-medium">Preferred Privilege CTA Configured</span>
                        {showQxPerks ? (
                          <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                        ) : (
                          <span className="text-bordeaux font-medium">— Disabled</span>
                        )}
                      </div>
                    </>
                  )}

                  {currentType === 'news' && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink-2 font-medium">TL;DR Box Configured</span>
                      {tldr ? (
                        <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="text-bordeaux font-medium">— Missing</span>
                      )}
                    </div>
                  )}
                </div>

                {/* GEO & Manual SEO Toggles */}
                <div className="bg-paper/40 p-4 border border-ink/5 flex flex-col gap-3 text-xs mt-2">
                  <div className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold mb-1">GEO & Manual SEO Toggles</div>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={entityDensity} onChange={e => setEntityDensity(e.target.checked)} className="accent-midnight w-4 h-4" />
                    <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">Entity Density Optimal</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={citationReadiness} onChange={e => setCitationReadiness(e.target.checked)} className="accent-midnight w-4 h-4" />
                    <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">Citation Readiness Check</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={directAnswerFormatting} onChange={e => setDirectAnswerFormatting(e.target.checked)} className="accent-midnight w-4 h-4" />
                    <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">Direct Answer Formatting</span>
                  </label>

                  <div className="border-t border-ink/5 my-1" />

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={geoPassed} onChange={e => setGeoPassed(e.target.checked)} className="accent-midnight w-4 h-4" />
                    <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">GEO Passed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={altTextOptimized} onChange={e => setAltTextOptimized(e.target.checked)} className="accent-midnight w-4 h-4" />
                    <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">Hero Alt-Text Optimized</span>
                  </label>
                </div>

                {/* Private Sources Citations Section */}
                <div className="border-t border-ink/10 pt-6 mt-2 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-serif text-base font-semibold text-ink">Intelligence Sources Dossier</h4>
                    <span className="text-[9px] uppercase tracking-wider bg-sage/10 text-sage px-2 py-0.5 font-bold">
                      {sources.length} Verified Sources
                    </span>
                  </div>
                  
                  {sources.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {sources.map((source, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2 bg-paper/50 p-2.5 border border-ink/5">
                          <span className="text-ink-3 font-mono mt-0.5">[{idx + 1}]</span>
                          <a href={source} target="_blank" rel="noreferrer" className="text-ink hover:text-bordeaux dark:hover:text-gold-soft hover:underline break-all">
                            {source}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-ink-3 italic p-4 bg-paper/30 border border-ink/5 text-center">
                      No intelligence sources cited for this article.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}

          {editorTab === 'design' && (
            <div className="w-full lg:w-[800px] mx-auto bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-none flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Article Converter */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Article Type
                  </label>
                  <select 
                    className="w-full text-sm bg-card border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={currentType}
                    onChange={e => {
                      const newType = e.target.value as 'review' | 'program' | 'news' | 'general';
                      setCurrentType(newType);
                      if (newType === 'program') {
                        setCategory('Preferred Partner');
                      } else if (newType === 'news') {
                        setCategory('Hotel News');
                      } else if (newType === 'general') {
                        setCategory('Travel News');
                      } else {
                        setCategory('Hotel Review');
                      }
                    }}
                  >
                    <option value="review">Hotel Review</option>
                    <option value="program">Preferred Partner Guide</option>
                    <option value="news">Hotel News Opening</option>
                    <option value="general">General News</option>
                  </select>
                </div>

                {/* Publish / Scheduling Date & Time */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Publish / Scheduling Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={formatDatetimeLocal(date)}
                    onChange={e => {
                      if (e.target.value) {
                        setDate(new Date(e.target.value).toISOString());
                      }
                    }}
                  />
                  <p className="text-[10px] text-ink-3">
                    Specify the date-time this article is published or scheduled.
                  </p>
                </div>

                {/* Gallery Style */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Gallery Block Style
                  </label>
                  <select 
                    className="w-full text-sm bg-card border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={galleryStyle}
                    onChange={e => setGalleryStyle(e.target.value)}
                  >
                    <option value="grid">Grid View</option>
                    <option value="carousel">Carousel View</option>
                  </select>
                </div>



                {/* Cover/OG Image URL */}
                <div className="md:col-span-2 flex flex-col gap-2 border-t border-ink/10 pt-6 mt-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Featured Hero Image URL
                  </label>
                  <input 
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                  />
                  {ogImage && (
                    <div className="relative w-full aspect-[16/9] overflow-hidden border border-ink/10 bg-paper/50 rounded-none mt-2">
                      <img src={ogImage} alt="Hero preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Hero Video URL */}
                <div className="md:col-span-2 flex flex-col gap-2 border-t border-ink/10 pt-6 mt-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Hero Video URL / YouTube ID
                  </label>
                  <input 
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or YouTube Video ID"
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={heroVideo}
                    onChange={e => setHeroVideo(e.target.value)}
                  />
                  <p className="text-[10px] text-ink-3">
                    If no video is added, the Featured Hero Image will be used instead.
                  </p>
                </div>

                {/* Hero Caption */}
                <div className="md:col-span-2 flex flex-col gap-2 border-t border-ink/10 pt-6 mt-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    Hero Media Caption Text
                  </label>
                  <input 
                    type="text"
                    placeholder="Enter caption text to display below the hero image/video..."
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={heroCaption}
                    onChange={e => setHeroCaption(e.target.value)}
                  />
                </div>

              </div>
            </div>
          )}

          {editorTab === 'editorial' && (
            <div className="w-full lg:w-[800px] mx-auto bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-none flex flex-col gap-6">
              <div className="border-b border-ink/10 pb-4">
                <h4 className="font-serif text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-bordeaux dark:text-gold-soft" />
                  Editorial Boxes & Metadata Blocks
                </h4>
                <p className="text-[10px] text-ink-3 uppercase tracking-wider mt-1">Configure layout cards and summary components</p>
              </div>

              {currentType === 'review' && (
                <div className="flex flex-col gap-6">
                  {/* TL;DR Summary Card */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">TL;DR Summary Card (Markdown bullet points)</label>
                    <textarea 
                      rows={4}
                      placeholder="- Point one&#10;- Point two"
                      value={tldr}
                      onChange={e => setTldr(e.target.value)}
                      className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none resize-y font-mono"
                    />
                  </div>

                  <div className="border-t border-ink/10 pt-6">
                    <h5 className="font-serif text-sm font-semibold text-ink mb-4">Detailed Verdict Box Settings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Verdict Headline</label>
                        <input 
                          type="text" 
                          value={verdictHead}
                          onChange={e => setVerdictHead(e.target.value)}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Verdict Highlight</label>
                        <input 
                          type="text" 
                          value={verdictHighlight}
                          onChange={e => setVerdictHighlight(e.target.value)}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Verdict Rating Score (1-10)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          min="1" 
                          max="10" 
                          value={rating}
                          onChange={e => setRating(Number(e.target.value))}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-ink/10 pt-6 flex flex-col gap-4">
                    <h5 className="font-serif text-sm font-semibold text-ink">Preferred Privilege Perks</h5>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={showQxPerks} 
                        onChange={e => setShowQxPerks(e.target.checked)} 
                        className="accent-midnight w-4 h-4" 
                      />
                      <span className="text-xs text-ink-2 font-medium group-hover:text-ink transition-colors">Show QX Travel Perks Banner?</span>
                    </label>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">QX Travel Booking Link Override</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        value={partnerLink}
                        onChange={e => setPartnerLink(e.target.value)}
                        className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentType === 'program' && (
                <div className="flex flex-col gap-6">
                  <div className="border-t border-ink/10 pt-6">
                    <h5 className="font-serif text-sm font-semibold text-ink mb-4">Program Verdict Box Settings</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Best For</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Design Lovers & Wellness Retreats"
                          value={verdictBestFor}
                          onChange={e => setVerdictBestFor(e.target.value)}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Program Highlight</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Complimentary breakfast & room upgrades"
                          value={verdictHighlight}
                          onChange={e => setVerdictHighlight(e.target.value)}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">Program Score (1-10)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 9.5"
                          value={verdictScore}
                          onChange={e => setVerdictScore(e.target.value)}
                          className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentType === 'news' && (
                <div className="flex flex-col gap-6">
                  {/* TL;DR Summary Card */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">TL;DR Summary Card (Markdown bullet points)</label>
                    <textarea 
                      rows={4}
                      placeholder="- Point one&#10;- Point two"
                      value={tldr}
                      onChange={e => setTldr(e.target.value)}
                      className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none resize-y font-mono"
                    />
                  </div>

                  <div className="border-t border-ink/10 pt-6 flex flex-col gap-4">
                    <h5 className="font-serif text-sm font-semibold text-ink">Early Newsletter Dispatch</h5>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={earlyNewsletterCta} 
                        onChange={e => setEarlyNewsletterCta(e.target.checked)} 
                        className="accent-midnight w-4 h-4" 
                      />
                      <span className="text-xs text-ink-2 font-medium group-hover:text-ink transition-colors">Show Early beehiiv Newsletter CTA?</span>
                    </label>
                  </div>
                </div>
              )}

              {currentType === 'general' && (
                <div className="flex flex-col gap-6">
                  {/* TL;DR Summary Card */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold">TL;DR Summary Card (Markdown bullet points)</label>
                    <textarea 
                      rows={6}
                      placeholder="- Key takeaway one&#10;- Key takeaway two&#10;- Key takeaway three"
                      value={tldr}
                      onChange={e => setTldr(e.target.value)}
                      className="w-full text-xs p-3 bg-transparent border border-ink/15 outline-none focus:border-ink rounded-none resize-y font-mono text-ink"
                    />
                    <p className="text-[10px] text-ink-3 italic">This TL;DR section will appear at the very top of your article page.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {editorTab === 'preview' && (
            <div className="w-full flex flex-col gap-4">
              {/* Viewport toggle controls */}
              <div className="flex justify-center items-center gap-3 bg-card border border-ink/10 p-2 max-w-[320px] mx-auto w-full shadow-sm rounded-none">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-2 flex items-center justify-center rounded-none transition-colors cursor-pointer min-h-[36px] min-w-[36px] ${
                    previewViewport === 'desktop' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink font-medium'
                  }`}
                  title="Desktop View"
                >
                  <span className="text-xs uppercase font-bold tracking-wider px-1">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-2 flex items-center justify-center rounded-none transition-colors cursor-pointer min-h-[36px] min-w-[36px] ${
                    previewViewport === 'tablet' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink font-medium'
                  }`}
                  title="Tablet View"
                >
                  <span className="text-xs uppercase font-bold tracking-wider px-1">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-2 flex items-center justify-center rounded-none transition-colors cursor-pointer min-h-[36px] min-w-[36px] ${
                    previewViewport === 'mobile' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink font-medium'
                  }`}
                  title="Mobile View"
                >
                  <span className="text-xs uppercase font-bold tracking-wider px-1">Mobile</span>
                </button>
              </div>

              {/* Viewport Frame */}
              <div className="w-full overflow-x-auto py-4 flex justify-center">
                <div 
                  className={`bg-paper border border-ink/15 shadow-2xl transition-all duration-300 ${
                    previewViewport === 'desktop' ? 'w-full max-w-[1100px]' : 
                    previewViewport === 'tablet' ? 'w-[768px] min-h-[1024px]' : 'w-[375px] min-h-[667px]'
                  }`}
                >
                  {/* Website Simulator */}
                  <div className="p-6 md:p-12 text-midnight bg-[#FAF8F2] min-h-[800px] flex flex-col font-sans select-none">
                    
                    {/* Simulated Navbar header */}
                    <div className="border-b border-ink/10 pb-6 mb-8 flex justify-between items-center opacity-60">
                      <span className="font-serif italic font-semibold text-sm">Little bit of LUXE</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold">Journal</span>
                    </div>

                    {/* Simulated Article Header */}
                    <header className="text-center max-w-[800px] mx-auto mb-8">
                      <span className="lbl-eyebrow text-ink-3 text-[10px] uppercase tracking-widest mb-3 block">
                        {category}
                      </span>
                      <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight mb-4 text-midnight"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(title || '*Headline*') }}
                      />
                      <p className="font-serif italic text-base md:text-lg text-ink-2 max-w-[640px] mx-auto leading-relaxed mb-6">
                        {excerpt || 'Poetic sub-headline deck sentence...'}
                      </p>
                      
                      <div className="flex items-center justify-center gap-3 text-[10px] text-ink-3 font-semibold uppercase tracking-wider">
                        <span>By Our Editors</span>
                        <span>·</span>
                        <span>{currentType === 'review' ? (location || 'Inspection Location') : currentType === 'general' ? 'Insights' : (location || 'Brand Headquarters')}</span>
                        {currentType === 'review' && (
                          <>
                            <span>·</span>
                            <span className="bg-sage/10 text-sage px-2 py-0.5 font-bold">{verdictScore || '9.0'} / 10</span>
                          </>
                        )}
                      </div>
                    </header>

                    {/* Hero Media Block */}
                    <div className="w-full mb-10">
                      <div className="w-full aspect-[16/9] bg-midnight border border-ink/10 relative overflow-hidden flex items-center justify-center">
                        {heroVideo ? (
                          <div className="text-center text-sand flex flex-col items-center gap-2">
                            <VideoIcon className="w-8 h-8 text-gold-soft animate-pulse" />
                            <span className="text-[10px] tracking-wider uppercase font-bold">Video Theatre Active</span>
                            <span className="text-[9px] text-sand/60 max-w-[200px] truncate">{heroVideo}</span>
                          </div>
                        ) : (
                          <img 
                            src={ogImage} 
                            alt="Cover Preview" 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-ink-3 font-sans max-w-[640px] mx-auto mt-3 text-center italic">
                        {heroCaption || (currentType === 'review' ? `${hotelName || 'Property'} inspection, captured by Our Editors.` : currentType === 'general' ? '' : `${propertyName || 'Property'} brand vision announcement.`)}
                      </p>
                    </div>

                    {/* Main Content Column */}
                    <div className="max-w-[720px] mx-auto w-full flex flex-col gap-8">
                      
                      {/* TL;DR Box */}
                      {tldr && (
                        <div className="p-6 bg-[#F0ECE0] border border-ink/10 font-sans my-4">
                          <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-3">At a Glance</span>
                          <div 
                            className="prose prose-sm max-w-none text-xs text-ink-2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(tldr) }}
                          />
                        </div>
                      )}

                      {/* Main Prose Copy */}
                      <article 
                        className="prose max-w-none text-sm text-ink-2 leading-relaxed font-sans first-letter:float-left first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:mt-1 first-letter:text-midnight first-letter:font-semibold"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) || '<p>Write your article body content...</p>' }}
                      />

                      {/* Verdict Box (Reviews/Programs) */}
                      {currentType === 'review' && (
                        <div className="border border-midnight p-8 my-8 bg-paper">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-ink/15">
                            <div>
                              <span className="lbl-eyebrow text-ink-3 text-[10px] block mb-1">The Verdict</span>
                              <h3 className="font-serif text-xl font-bold text-midnight">{verdictHead || 'A quiet inspection summary'}</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-serif text-3xl font-bold text-midnight">{verdictScore || '9.0'}</span>
                              <span className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">/ 10</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                            <div>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-ink-3 block mb-2">Ideal For</span>
                              <p className="text-xs text-ink-2 leading-relaxed font-sans">{verdictBestFor || 'Considered, silent travelers seeking design depth.'}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-ink-3 block mb-2">Editor Highlight</span>
                              <p className="text-xs text-ink-2 leading-relaxed font-sans">{verdictHighlight || 'Exceptional craftsmanship and local materials integration.'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Perks Banner */}
                      {currentType === 'review' && showQxPerks && (
                        <div className="my-12 p-8 bg-midnight text-sand border-none">
                          <p className="lbl-eyebrow mb-2 text-sand/70">The Preferred Privilege</p>
                          <h3 className="lbl-h3 text-sand mb-4">Book {hotelName || 'this property'} with Perks</h3>
                          <p className="lbl-body text-sand/85 mb-6 text-xs leading-relaxed">
                            Through our preferred partnership, we unlock daily breakfast, priority upgrades, and property credits — matching the best flexible rates available directly, with all your standard loyalty nights and points fully recognized.
                          </p>
                          <span className="inline-block bg-sand text-midnight text-[10px] uppercase font-bold tracking-widest px-6 py-3 cursor-not-allowed">
                            Book via QX Travel
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Footer simulation */}
                    <div className="border-t border-ink/10 pt-8 mt-16 text-center text-[9px] uppercase tracking-widest text-ink-3 font-bold opacity-50">
                      Little Bit of Luxe &copy; 2026
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {editorTab === 'quality' && (
            <div className="max-w-[900px] mx-auto w-full bg-card border border-ink/10 p-8 shadow-sm flex flex-col gap-6 animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
                <BookOpenCheck className="w-6 h-6 text-midnight dark:text-sand" />
                <h2 className="lbl-h3 text-midnight dark:text-sand font-serif text-xl">Journal Quality &amp; SEO Checker</h2>
              </div>

              {/* Status Summary Banner */}
              {validation.errors.length > 0 ? (
                <div className="p-5 bg-bordeaux/15 border-l-4 border-bordeaux text-ink dark:text-sand flex gap-4 items-start rounded-none">
                  <span className="text-xl">❌</span>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-bordeaux">Article Fails Validation</h4>
                    <p className="text-xs text-ink-3 dark:text-sand-3 mt-1">There are {validation.errors.length} blocking issues that must be corrected before this article can be successfully saved to the database.</p>
                  </div>
                </div>
              ) : validation.warnings.length > 0 ? (
                <div className="p-5 bg-amber-500/10 border-l-4 border-amber-500 text-ink dark:text-sand flex gap-4 items-start rounded-none">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-amber-600 dark:text-amber-400">Stylistic Recommendations</h4>
                    <p className="text-xs text-ink-3 dark:text-sand-3 mt-1">The article passes basic validations and can be saved, but has {validation.warnings.length} recommendations to align with style guides and SEO standards.</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-sage/10 border-l-4 border-sage text-ink dark:text-sand flex gap-4 items-start rounded-none">
                  <span className="text-xl">✅</span>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider text-sage">Perfect Quality Score</h4>
                    <p className="text-xs text-ink-3 dark:text-sand-3 mt-1">This article meets all editorial guidelines, contains appropriate heading hierarchies, required fields, and is fully optimized for publication.</p>
                  </div>
                </div>
              )}

              {/* Blocking Errors Section */}
              {validation.errors.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-bordeaux">Blocking Errors ({validation.errors.length})</h3>
                  <div className="flex flex-col gap-2">
                    {validation.errors.map((err, i) => (
                      <div key={i} className="text-xs text-ink dark:text-sand-2 flex items-start gap-2 bg-bordeaux/5 p-3 border border-bordeaux/10">
                        <span className="text-bordeaux font-bold">▪</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings Section */}
              {validation.warnings.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 font-sans font-semibold">Editorial &amp; SEO Suggestions ({validation.warnings.length})</h3>
                  <div className="flex flex-col gap-2">
                    {validation.warnings.map((warn, i) => (
                      <div key={i} className="text-xs text-ink dark:text-sand-2 flex items-start gap-2 bg-amber-500/5 p-3 border border-amber-500/10">
                        <span className="text-amber-500 font-bold">▪</span>
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Style Reminder Card */}
              <div className="border-t border-ink/10 pt-6 mt-4">
                <h4 className="text-[10px] uppercase tracking-widest text-ink-3 font-semibold mb-2">Visual &amp; Editorial Standards Reminder</h4>
                <ul className="text-xs text-ink-3 dark:text-sand-3 flex flex-col gap-1.5 list-disc pl-4 italic">
                  <li>Headline titles must contain *exactly one word or phrase italicized* using asterisks to match layout typography.</li>
                  <li>Keep excerpt sizes between 40 and 300 characters to prevent overflow on grid displays.</li>
                  <li>Headings inside body copy must only use Heading 2 (##) or Heading 3 (###) to populate the sidebar index. Do not use Heading 1 (#) which is reserved for the page title.</li>
                  <li>Star ratings for hotels are formatted as decimals (e.g. 9.3) out of 10.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

      </main>
{/* CLOUDINARY LOADER POPUP */}
      {cloudinaryOpen && (
        <div className="fixed inset-0 bg-midnight/60 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-ivory dark:bg-[#0D152D] text-midnight dark:text-sand border border-midnight/20 dark:border-sand/20 p-6 md:p-8 max-w-[480px] w-full shadow-2xl rounded-none flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif text-lg font-semibold text-ink">Load Cloudinary Media</h4>
              <button 
                type="button"
                onClick={() => setCloudinaryOpen(false)}
                className="text-ink/60 hover:text-ink text-xl font-bold min-h-[32px] min-w-[32px] cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold font-sans">Cloudinary Image URL</label>
                <input 
                  type="text" 
                  placeholder="https://res.cloudinary.com/..." 
                  value={cloudinaryUrl}
                  onChange={e => setCloudinaryUrl(e.target.value)}
                  className="w-full text-xs p-3 border border-ink/15 bg-transparent outline-none focus:border-ink text-ink rounded-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold font-sans">Image Caption</label>
                <input 
                  type="text" 
                  placeholder="e.g. Grand Canal view from Aman Venice balcony" 
                  value={cloudinaryCaption}
                  onChange={e => setCloudinaryCaption(e.target.value)}
                  className="w-full text-xs p-3 border border-ink/15 bg-transparent outline-none focus:border-ink text-ink rounded-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setCloudinaryOpen(false)}
                className="px-4 py-2 border border-ink/20 text-xs uppercase tracking-wider hover:bg-ink/5 cursor-pointer rounded-none min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (cloudinaryUrl) {
                    const imgTag = `<figure class="my-8"><img src="${cloudinaryUrl}" alt="${cloudinaryCaption || 'Luxury travel image'}" class="w-full h-auto object-cover" />${cloudinaryCaption ? `<figcaption class="lbl-caption mt-2">${cloudinaryCaption} — Editor</figcaption>` : ''}</figure>`;
                    if (editorInstanceRef.current) {
                      editorInstanceRef.current.commands.insertContent(imgTag);
                    } else {
                      setContent((prev: string) => prev + '\n\n' + imgTag);
                    }
                    setCloudinaryUrl('');
                    setCloudinaryCaption('');
                    setCloudinaryOpen(false);
                  }
                }}
                className="px-4 py-2 bg-midnight text-sand dark:bg-sand dark:text-midnight text-xs uppercase tracking-wider font-bold cursor-pointer rounded-none min-h-[44px]"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO LOADER POPUP */}
      {videoOpen && (
        <div className="fixed inset-0 bg-midnight/60 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-ivory dark:bg-[#0D152D] text-midnight dark:text-sand border border-midnight/20 dark:border-sand/20 p-6 md:p-8 max-w-[480px] w-full shadow-2xl rounded-none flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif text-lg font-semibold text-ink">Load Video Media</h4>
              <button 
                type="button"
                onClick={() => setVideoOpen(false)}
                className="text-ink/60 hover:text-ink text-xl font-bold min-h-[32px] min-w-[32px] cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold font-sans">Vimeo, YouTube, or Custom Video Link</label>
              <input 
                type="text" 
                placeholder="e.g. https://vimeo.com/839485" 
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full text-xs p-3 border border-ink/15 bg-transparent outline-none focus:border-ink text-ink rounded-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setVideoOpen(false)}
                className="px-4 py-2 border border-ink/20 text-xs uppercase tracking-wider hover:bg-ink/5 cursor-pointer rounded-none min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (videoUrl) {
                    let embedUrl = videoUrl;
                    const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                    const vimeoMatch = videoUrl.match(/(?:vimeo\.com\/(?:[a-z0-9-_]+\/)*|player\.vimeo\.com\/video\/)([0-9]+)/i);
                    
                    let markup = '';
                    if (ytMatch) {
                      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                      markup = `<div class="relative w-full aspect-video my-8 bg-midnight border border-sand/10"><iframe src="${embedUrl}" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                    } else if (vimeoMatch) {
                      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                      markup = `<div class="relative w-full aspect-video my-8 bg-midnight border border-sand/10"><iframe src="${embedUrl}" class="absolute inset-0 w-full h-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
                    } else {
                      markup = `<div class="relative w-full aspect-video my-8 bg-midnight border border-sand/10"><video src="${videoUrl}" controls class="absolute inset-0 w-full h-full object-cover"></video></div>`;
                    }
                    
                    if (editorInstanceRef.current) {
                      editorInstanceRef.current.commands.insertContent(markup);
                    } else {
                      setContent((prev: string) => prev + '\n\n' + markup);
                    }
                    setVideoUrl('');
                    setVideoOpen(false);
                  }
                }}
                className="px-4 py-2 bg-midnight text-sand dark:bg-sand dark:text-midnight text-xs uppercase tracking-wider font-bold cursor-pointer rounded-none min-h-[44px]"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}



    
    </div>
  );
}