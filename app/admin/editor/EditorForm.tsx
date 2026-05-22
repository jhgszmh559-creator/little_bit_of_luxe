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
  Clock,
  BookOpenCheck
} from 'lucide-react';
import { parseMarkdown } from '@/lib/markdown';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';


interface ArticleItem {
  title: string;
  slug: string;
  category: string;
  type: 'program' | 'review' | 'news';
}

interface EditorFormProps {
  type: 'review' | 'program' | 'news';
  slug: string;
  initialData: any;
  allArticles?: ArticleItem[];
}

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
    const isCustomBlock = tagName === 'div' || tagName === 'figure' || tagName === 'figcaption' || tagName === 'iframe' || tagName === 'video';
    
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
      case 'ul':
        return `\n\n${childrenMarkdown}\n\n`;
      case 'li':
        return `- ${childrenMarkdown.trim()}\n`;
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
  const [category, setCategory] = useState(initialData?.category || (currentType === 'program' ? 'Preferred Partner' : currentType === 'news' ? 'Hotel News' : 'Hotel Review'));
  const [draft, setDraft] = useState(initialData?.draft !== undefined ? initialData.draft : true);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

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
  const [galleryStyle, setGalleryStyle] = useState('grid');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // News specific fields
  const [propertyName, setPropertyName] = useState(initialData?.propertyName || '');
  const [projectedOpening, setProjectedOpening] = useState(initialData?.projectedOpening || '');
  const [earlyNewsletterCta, setEarlyNewsletterCta] = useState(initialData?.earlyNewsletterCta !== false);
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'design' | 'strategy'>('write');


  // Lifecycle & Citations State
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(initialData?.status || (initialData?.draft === false ? 'published' : 'draft'));
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

  const handleSave = async (overrideStatus?: 'published' | 'draft' | 'archived', e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!slug) {
      alert('Please provide a unique URL slug.');
      return;
    }

    setSaving(true);
    setMessage('');

    const currentStatus = overrideStatus || status;
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
      // News specific
      propertyName,
      projectedOpening,
      earlyNewsletterCta,
      sourceUrl,
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
    const text = currentType === 'program' ? programName : currentType === 'news' ? propertyName : hotelName;
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
          
          {status === 'published' ? (
            <>
              <button
                type="button"
                onClick={() => handleSave('archived')}
                disabled={saving}
                className="btn--secondary text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 font-sans tracking-widest uppercase font-semibold border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-white rounded-none transition-colors"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving}
                className="btn--sand text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 font-sans tracking-widest uppercase font-semibold border border-midnight rounded-none"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Update Published Article'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 font-sans tracking-widest uppercase font-semibold border border-ink/20 text-ink/70 hover:bg-ink/5 rounded-none transition-colors"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving}
                className="btn--sand text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 font-sans tracking-widest uppercase font-semibold border border-midnight rounded-none"
              >
                <Save className="w-4 h-4" /> {saving ? 'Publishing...' : 'Publish Article'}
              </button>
            </>
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
        <div className="flex bg-card border border-ink/10 p-1 rounded-none shadow-sm max-w-[720px] mx-auto w-full">
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
            onClick={() => setEditorTab('strategy')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-none transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
              editorTab === 'strategy' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight font-bold' : 'text-ink-3 hover:text-ink bg-transparent font-medium'
            }`}
          >
            <Settings className="w-4 h-4" /> SEO & Strategy
          </button>
        </div>

        {/* Dynamic Split Layout */}
        <div className="flex-grow">
          
          {editorTab === 'write' && (
            <div className="w-full lg:w-[800px] mx-auto flex flex-col gap-6 bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-none">
              
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
                
                <div className="bg-card border border-ink/10 flex items-center p-2 gap-2 mb-4 rounded-none overflow-x-auto">
                  <span className="text-[10px] uppercase tracking-widest text-ink/50 font-bold ml-2 mr-2 whitespace-nowrap">Luxury Assets</span>
                  <div className="w-px h-4 bg-ink/10 mx-1" />
                  <button type="button" onClick={() => setCloudinaryOpen(true)} className="text-[10px] uppercase font-bold tracking-wider px-3 py-2 hover:bg-ink/5 text-ink transition-colors border border-transparent whitespace-nowrap">
                    Image (Cloudinary)
                  </button>
                  <button type="button" onClick={() => setVideoOpen(true)} className="text-[10px] uppercase font-bold tracking-wider px-3 py-2 hover:bg-ink/5 text-ink transition-colors border border-transparent whitespace-nowrap">
                    Video
                  </button>
                  <button type="button" onClick={() => {
                    const html = `<div class="gallery gallery-${galleryStyle}">[Gallery Placeholder]</div>`;
                    if (editorInstanceRef.current) {
                      editorInstanceRef.current.commands.insertContent(html);
                    } else {
                      setContent((prev: string) => prev + '\n\n' + html);
                    }
                  }} className="text-[10px] uppercase font-bold tracking-wider px-3 py-2 hover:bg-ink/5 text-ink transition-colors border border-transparent whitespace-nowrap">
                    Gallery Block
                  </button>
                </div>
                <div className="bg-transparent relative">
                  <SimpleEditor 
                    content={parseMarkdown(content)} 
                    onUpdate={(html) => setContent(convertHtmlToMarkdown(html))} 
                    onEditorReady={(editor) => {
                      editorInstanceRef.current = editor;
                    }}
                  />
                </div>
              </div>

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
                    onChange={e => setCurrentType(e.target.value as 'review' | 'program' | 'news')}
                  >
                    <option value="review">Hotel Review</option>
                    <option value="program">Preferred Partner Guide</option>
                    <option value="news">Hotel News Opening</option>
                  </select>
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

                {/* QX Travel Partner Link */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                    QX Travel Partner Link
                  </label>
                  <input 
                    type="url"
                    placeholder="https://..."
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-none min-h-[44px]"
                    value={partnerLink}
                    onChange={e => setPartnerLink(e.target.value)}
                  />
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

              </div>
            </div>
          )}

          {editorTab === 'strategy' && (
            <div className="w-full lg:w-[800px] mx-auto bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-none flex flex-col gap-6">
              
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

                <div className="flex items-center justify-between">
                  <span className="text-ink-2 font-medium">Internal Links Present</span>
                  {internalLinksPresent() ? (
                    <span className="text-sage font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Yes</span>
                  ) : (
                    <span className="text-bordeaux font-medium">— No</span>
                  )}
                </div>
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
                  <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">GEO (Generative Optimization) Passed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={altTextOptimized} onChange={e => setAltTextOptimized(e.target.checked)} className="accent-midnight w-4 h-4" />
                  <span className="text-ink-2 font-medium group-hover:text-ink transition-colors">Featured Image Alt-Text Optimized</span>
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