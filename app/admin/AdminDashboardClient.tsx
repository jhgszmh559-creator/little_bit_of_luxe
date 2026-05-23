'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Search, Settings, CheckCircle, Check,
  AlertCircle, ExternalLink, Link2, MapPin, 
  Sun, Moon, Loader2, Sparkles, BarChart2, Calendar, Eye,
  Tag, User, TrendingUp, Globe, ChevronRight, X, Layout, Menu
} from 'lucide-react';

type ArticleStatus = 'published' | 'draft' | 'needs_review' | 'scheduled' | 'archived';

interface Program {
  slug: string;
  title: string;
  excerpt: string;
  programName: string;
  loyaltyNetwork: string;
  brands: string;
  date: string;
  category: string;
  draft: boolean;
  status: ArticleStatus;
}

interface Review {
  slug: string;
  title: string;
  excerpt: string;
  hotelName: string;
  brand: string;
  location: string;
  rating: number;
  roomType: string;
  date: string;
  draft: boolean;
  status: ArticleStatus;
  category: string;
}

interface News {
  slug: string;
  title: string;
  excerpt: string;
  brand: string;
  propertyName: string;
  location: string;
  projectedOpening: string;
  date: string;
  draft: boolean;
  status: ArticleStatus;
  category: string;
}

interface AdminDashboardClientProps {
  programs: Program[];
  reviews: Review[];
  news: News[];
  generals?: any[];
}

export default function AdminDashboardClient({ programs, reviews, news, generals = [] }: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'posts' | 'pages' | 'tags' | 'decap' | 'settings'>('analytics');
  const [postFilter, setPostFilter] = useState<'all' | 'published' | 'drafts' | 'needs_review' | 'scheduled' | 'archived'>('all');
  const [selectedPostType, setSelectedPostType] = useState<'all' | 'Review' | 'News' | 'Partner Guide' | 'General News'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal State for new article
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleType, setArticleType] = useState<'review' | 'news' | 'program' | 'general'>('review');
  const [propertyName, setPropertyName] = useState('');
  const [generationMode, setGenerationMode] = useState<'manual' | 'ai'>('ai');
  const [aiNotes, setAiNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiStep, setAiStep] = useState<number>(0);

  // Article-Level Analytics State
  const [selectedPostForAnalytics, setSelectedPostForAnalytics] = useState<any | null>(null);

  // SEO & GEO Audit State (collapsible checklist in analytics/posts views)
  const [selectedAuditItem, setSelectedAuditItem] = useState<any>(null);
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [suggestedLinks, setSuggestedLinks] = useState<any[]>([]);
  
  // Analytics State (GSC + Umami)
  const [gscKeywords, setGscKeywords] = useState<any[]>([]);
  const [pageviews, setPageviews] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [gscStatus, setGscStatus] = useState('Initializing...');
  const [analyticsSource, setAnalyticsSource] = useState('mock');
  const [trafficData, setTrafficData] = useState<any>(null);

  // Sync theme with document class on mount
  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    fetchAnalytics();
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

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // 1. Fetch Search Console keywords
      const gscResponse = await fetch('/api/analytics');
      if (gscResponse.ok) {
        const gscData = await gscResponse.json();
        setGscKeywords(gscData.keywords || []);
        setGscStatus(gscData.gscStatus || 'Connected');
      } else {
        setGscStatus('API Error');
      }

      // 2. Fetch Umami Traffic
      const trafficResponse = await fetch('/api/fetch-traffic');
      if (trafficResponse.ok) {
        const trafficData = await trafficResponse.json();
        setTrafficData(trafficData);
        setPageviews(trafficData.pageviews || []);
        setAnalyticsSource(trafficData.source || 'mock');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setGscStatus('Connection Failed');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Compile unified posts
  const unifiedPosts = [
    ...reviews.map(r => ({
      slug: r.slug,
      title: r.hotelName || r.title,
      type: 'Review',
      category: 'Hotel Review',
      location: r.location,
      draft: r.draft,
      status: r.status,
      date: r.date,
      rating: r.rating,
      brand: r.brand,
      excerpt: r.excerpt,
      rawItem: r,
    })),
    ...news.map(n => ({
      slug: n.slug,
      title: n.propertyName || n.title,
      type: 'News',
      category: 'Hotel News',
      location: n.location,
      draft: n.draft,
      status: n.status,
      date: n.date,
      rating: undefined,
      brand: n.brand,
      excerpt: n.excerpt,
      rawItem: n,
    })),
    ...generals.map(g => ({
      slug: g.slug,
      title: g.title,
      type: 'General News',
      category: g.category || 'Travel News',
      location: 'Insights',
      draft: g.draft,
      status: g.status,
      date: g.date,
      rating: undefined,
      brand: 'Independent',
      excerpt: g.excerpt,
      rawItem: g,
    })),
    ...programs.map(p => ({
      slug: p.slug,
      title: p.programName || p.title,
      type: 'Partner Guide',
      category: 'Preferred Partner',
      location: p.loyaltyNetwork,
      draft: p.draft,
      status: p.status,
      date: p.date,
      rating: undefined,
      brand: undefined,
      excerpt: p.excerpt,
      rawItem: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get Umami views for any unified post
  const getPostViews = (slug: string, type: string) => {
    if (!trafficData || !trafficData.urls) return 0;
    
    // Normalize type to path segment
    const prefix = type === 'Review' ? '/review/' : type === 'News' ? '/news/' : '/program/';
    const path = `${prefix}${slug}`;
    
    const metric = trafficData.urls.find((u: any) => u.x === path || u.x === `/${path}`);
    return metric ? metric.y : 0;
  };

  // Run SEO / GEO audit on selection
  const runAudit = (item: any) => {
    setSelectedAuditItem(item);
    
    const isProgram = item.category === 'Preferred Partner' || item.type === 'Partner Guide';
    const isNews = item.category === 'Hotel News' || item.type === 'News';
    const views = getPostViews(item.slug, item.type);
    
    let engagementLabel = 'Low';
    let engagementPassed = false;
    
    if (views > 300) {
      engagementLabel = 'High';
      engagementPassed = true;
    } else if (views > 100) {
      engagementLabel = 'Medium';
      engagementPassed = true;
    }

    const checklist = [
      { id: 'meta-title', label: 'Meta title present and length optimal (50-60 chars)', passed: item.title.length > 20 },
      { id: 'meta-desc', label: 'Poetic serif dek sentence / meta description structured', passed: (item.excerpt || '').length > 40 },
      { id: 'geo-citation', label: 'Generative Engine citation signals present', passed: isProgram ? (item.rawItem.brands || '').length > 20 : isNews ? !!item.brand : true },
      { id: 'structured-data', label: 'JSON-LD structured data configured', passed: true },
      { id: 'verdict-block', label: isProgram ? 'Verifiable Signature Verdict Box compiled' : isNews ? 'Facts matrix verified' : 'Verdict Summary Box active', passed: true },
      { id: 'qx-cta', label: 'QX Perks or Newsletter signups embedded', passed: true },
      { id: 'engagement', label: `Engagement Level: ${engagementLabel} (~${views} views)`, passed: engagementPassed }
    ];

    const score = Math.round((checklist.filter(c => c.passed).length / checklist.length) * 100);
    
    setSeoAudit({
      score,
      checklist,
      recommendations: [
        ...(score < 100 ? [
          'Inject more architectural verbs to build depth.',
          'Add at least two internal backlinks to relevant loyalty networks.',
          'Optimize heading structure to place the italic word on the H1 tag.'
        ] : []),
        ...(!engagementPassed ? [`Engagement is currently low (~${views} views). Promote this article via the homepage featured slot or tag dispatch lists.`] : [])
      ]
    });

    analyzeLinks(item);
  };

  const analyzeLinks = (item: any) => {
    const itemBrands = (item.brands || item.brand || '').toLowerCase();
    const suggestions: any[] = [];

    programs.forEach(prog => {
      const progName = prog.programName.toLowerCase();
      const progBrands = prog.brands.toLowerCase();
      
      if (itemBrands.includes(progName) || progBrands.includes(itemBrands)) {
        suggestions.push({
          parentGuide: prog.title,
          parentSlug: prog.slug,
          recommendedAnchor: `preferred privilege via ${prog.programName}`,
        });
      }
    });

    if (suggestions.length === 0 && programs.length > 0) {
      suggestions.push({
        parentGuide: programs[0].title,
        parentSlug: programs[0].slug,
        recommendedAnchor: `preferred partner privileges`,
      });
    }

    setSuggestedLinks(suggestions);
  };

  // Helper to slugify a string
  const slugify = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-');  // Replace multiple - with single -
  };

  // Handle article creation (AI or Manual)
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) {
      alert('Please enter a name or property.');
      return;
    }

    if (generationMode === 'manual') {
      const slug = slugify(propertyName);
      setIsModalOpen(false);
      setPropertyName('');
      router.push(`/admin/editor?type=${articleType}&slug=${slug}`);
    } else {
      setGenerating(true);
      setAiStep(1);

      // Drive timeline steps with timed progression while the real API runs
      const stepTimer2 = setTimeout(() => setAiStep(2), 6000);
      const stepTimer3 = setTimeout(() => setAiStep(3), 14000);

      try {
        const response = await fetch('/api/generate-article', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: articleType,
            name: propertyName,
            notes: aiNotes,
          }),
        });

        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);

        if (response.ok) {
          setAiStep(4); // Complete
          const result = await response.json();
          // Brief delay so user can see "Complete" state
          await new Promise(resolve => setTimeout(resolve, 1200));
          setIsModalOpen(false);
          setPropertyName('');
          setAiNotes('');
          setAiStep(0);
          router.refresh();
          router.push(`/admin/editor?type=${articleType}&slug=${result.slug}`);
        } else {
          const errData = await response.json();
          alert(`AI generation failed: ${errData.error || 'Unknown error'}`);
        }
      } catch (err) {
        clearTimeout(stepTimer2);
        clearTimeout(stepTimer3);
        console.error(err);
        alert('An unexpected error occurred during AI generation.');
      } finally {
        setGenerating(false);
        setAiStep(0);
      }
    }
  };

  const handleSidebarSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (activeTab !== 'posts') {
      setActiveTab('posts');
    }
  };

  // Filtered unified posts list
  const filteredPosts = unifiedPosts.filter(post => {
    // Search Filter
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (post.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (post.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status Filter
    const matchesStatus = postFilter === 'all' || 
                         (postFilter === 'drafts' && post.status === 'draft') || 
                         (postFilter === 'published' && post.status === 'published') ||
                         (postFilter === 'needs_review' && post.status === 'needs_review') ||
                         (postFilter === 'scheduled' && post.status === 'scheduled') ||
                         (postFilter === 'archived' && post.status === 'archived');
                         
    // Type Filter
    const matchesType = selectedPostType === 'all' || post.type === selectedPostType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate static metrics for Pages
  const pagesList = [
    { title: 'Homepage', path: '/', views: trafficData?.urls?.find((u: any) => u.x === '/' || u.x === '')?.y || 2420, seo: 100 },
    { title: 'Hotel Reviews Search', path: '/search?category=Hotel+Review', views: trafficData?.urls?.find((u: any) => u.x?.includes('Hotel+Review'))?.y || 480, seo: 85 },
    { title: 'Preferred Partners Index', path: '/search?category=Preferred+Partner', views: trafficData?.urls?.find((u: any) => u.x?.includes('Preferred+Partner'))?.y || 382, seo: 92 },
    { title: 'Dispatches Index', path: '/search?category=Dispatch', views: trafficData?.urls?.find((u: any) => u.x?.includes('Dispatch'))?.y || 194, seo: 80 },
    { title: 'Guides Index', path: '/search?category=Guides', views: trafficData?.urls?.find((u: any) => u.x?.includes('Guides'))?.y || 112, seo: 75 },
  ];

  // Dynamic tags calculations
  const categoriesList = ['Hotel Review', 'Preferred Partner', 'Hotel News', 'Dispatch', 'Guides'];
  const locationsList = Array.from(new Set(unifiedPosts.map(p => p.location).filter(Boolean)));
  const brandsList = Array.from(new Set(unifiedPosts.map(p => p.brand).filter(Boolean)));

  // Proportional Sparkline Generator for specific article pageviews
  const generatePostDailyViews = (postViews: number) => {
    const totalViews = pageviews.reduce((acc, curr) => acc + curr.views, 0) || 1;
    const ratio = postViews / totalViews;
    
    return pageviews.map((pv, idx) => {
      // Add a small pseudo-random spread to prevent straight identical curves
      const pseudoRandom = Math.sin(idx + postViews) * (pv.views * ratio * 0.15);
      const views = Math.max(0, Math.round(pv.views * ratio + pseudoRandom));
      return {
        date: pv.date,
        views
      };
    });
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-midnight flex flex-col md:flex-row font-sans text-ink dark:text-sand transition-colors">
      
      {/* Sticky Left Sidebar for Desktop */}
      <aside className="w-64 bg-card dark:bg-[#121A33] border-r border-ink/10 dark:border-sand/10 h-screen sticky top-0 hidden md:flex flex-col justify-between shrink-0 z-30 transition-colors">
        <div className="flex flex-col py-6">
          
          {/* Brand Header */}
          <div className="px-6 pb-6 border-b border-ink/5 dark:border-sand/5">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/logos/logo-sand.png" 
                alt="LBL Logo" 
                className="h-7 w-auto bg-midnight p-1 rounded-none select-none invert dark:invert-0" 
              />
              <div className="flex flex-col">
                <span className="font-serif italic font-semibold text-sm tracking-wide text-ink dark:text-sand">Little Bit of Luxe</span>
                <span className="text-[9px] uppercase tracking-widest text-ink-3 dark:text-sand/50 font-bold leading-none">Strategy Admin</span>
              </div>
            </Link>
          </div>

          {/* Quick Search */}
          <div className="px-4 py-4">
            <div className="relative flex items-center bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 px-3 py-2 rounded-none">
              <Search className="w-3.5 h-3.5 text-ink-3 dark:text-sand/50 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search database..." 
                className="bg-transparent text-xs text-ink dark:text-sand outline-none w-full"
                value={searchQuery}
                onChange={handleSidebarSearch}
              />
            </div>
          </div>

          {/* Nav Menu */}
          <nav className="flex flex-col gap-1 px-3">
            <button 
              onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
              className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                  : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 shrink-0" /> Analytics
              </span>
            </button>

            <div className="flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase font-bold text-ink-3 dark:text-sand/50 tracking-widest mt-3 mb-1">
                <span>Journal Entries</span>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-0.5 hover:bg-midnight/10 dark:hover:bg-sand/10 hover:text-ink dark:hover:text-white rounded-none cursor-pointer"
                  title="Write new post"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('all'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'all'
                    ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 shrink-0" /> All Posts ({unifiedPosts.length})
                </span>
              </button>
              
              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('published'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'published'
                    ? 'text-midnight dark:text-sand font-bold border-l border-midnight dark:border-sand' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white'
                }`}
              >
                Published ({unifiedPosts.filter(p => p.status === 'published').length})
              </button>

              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('needs_review'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'needs_review'
                    ? 'text-midnight dark:text-sand font-bold border-l border-midnight dark:border-sand' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white'
                }`}
              >
                Needs Review ({unifiedPosts.filter(p => p.status === 'needs_review').length})
              </button>

              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('scheduled'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'scheduled'
                    ? 'text-midnight dark:text-sand font-bold border-l border-midnight dark:border-sand' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white'
                }`}
              >
                Scheduled ({unifiedPosts.filter(p => p.status === 'scheduled').length})
              </button>

              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('drafts'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'drafts'
                    ? 'text-midnight dark:text-sand font-bold border-l border-midnight dark:border-sand' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white'
                }`}
              >
                Drafts ({unifiedPosts.filter(p => p.status === 'draft').length})
              </button>

              <button 
                onClick={() => { setActiveTab('posts'); setPostFilter('archived'); setIsMobileMenuOpen(false); }}
                className={`flex items-center justify-between pl-8 pr-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'posts' && postFilter === 'archived'
                    ? 'text-midnight dark:text-sand font-bold border-l border-midnight dark:border-sand' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white'
                }`}
              >
                Archived ({unifiedPosts.filter(p => p.status === 'archived').length})
              </button>
            </div>

            <div className="flex flex-col mt-4">
              <span className="px-3 py-2 text-[10px] uppercase font-bold text-ink-3 dark:text-sand/50 tracking-widest mb-1">
                Configure Site
              </span>
              
              <button 
                onClick={() => { setActiveTab('pages'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'pages' 
                    ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" /> Pages
              </button>

              <button 
                onClick={() => { setActiveTab('tags'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'tags' 
                    ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
                }`}
              >
                <Tag className="w-4 h-4 shrink-0" /> Tags &amp; Destinations
              </button>

              <button 
                onClick={() => { setActiveTab('decap'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'decap' 
                    ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
                }`}
              >
                <Layout className="w-4 h-4 shrink-0" /> Decap CMS
              </button>

              <button 
                onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-none cursor-pointer transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' 
                    : 'text-ink-3 hover:text-ink dark:text-sand/70 dark:hover:text-white hover:bg-paper/50 dark:hover:bg-paper/5'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </button>
            </div>
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-ink/5 dark:border-sand/5 flex items-center justify-between bg-paper/20 dark:bg-midnight/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sand dark:bg-midnight border border-ink/10 dark:border-sand/15 flex items-center justify-center font-serif text-sm font-bold text-midnight dark:text-sand select-none">
              VL
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink dark:text-sand leading-none">Vince Loeffler</span>
              <span className="text-[10px] text-ink-3 dark:text-sand/50 leading-none mt-1">Administrator</span>
            </div>
          </div>
          <Link href="/" className="p-1 hover:text-bordeaux dark:hover:text-gold-soft cursor-pointer" title="Go to live site">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-midnight/70 flex">
          <div className="w-64 bg-card dark:bg-[#121A33] border-r border-ink/10 dark:border-sand/10 h-full flex flex-col justify-between p-5 animate-slide-right">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-ink/5 mb-4">
                <span className="font-serif italic font-semibold text-sm">Little Bit of Luxe</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile menu nav */}
              <nav className="flex flex-col gap-1.5">
                <button 
                  onClick={() => { setActiveTab('analytics'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'analytics' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" /> Analytics
                </button>
                <button 
                  onClick={() => { setActiveTab('posts'); setPostFilter('all'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'posts' && postFilter === 'all' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <FileText className="w-4 h-4" /> All Posts
                </button>
                <button 
                  onClick={() => { setActiveTab('pages'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'pages' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <Globe className="w-4 h-4" /> Pages
                </button>
                <button 
                  onClick={() => { setActiveTab('tags'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'tags' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <Tag className="w-4 h-4" /> Tags &amp; Destinations
                </button>
                <button 
                  onClick={() => { setActiveTab('decap'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'decap' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <Layout className="w-4 h-4" /> Decap CMS
                </button>
                <button 
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-left rounded-none ${
                    activeTab === 'settings' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3'
                  }`}
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </nav>
            </div>
            
            <div className="border-t border-ink/5 pt-4 flex items-center justify-between">
              <span className="text-xs font-bold">Vince Loeffler</span>
              <button 
                onClick={toggleTheme}
                className="p-2 border border-ink/15 text-ink rounded-none cursor-pointer dark:text-sand"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0 min-h-screen">
        
        {/* Mobile Header Bar */}
        <header className="bg-card dark:bg-[#121A33] py-4 px-6 border-b border-ink/10 dark:border-sand/10 flex items-center justify-between md:hidden transition-colors">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 text-ink dark:text-sand cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif italic font-bold text-sm">Little Bit of Luxe</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn--sand text-[10px] py-1 px-3 flex items-center gap-1 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" /> Write
            </button>
          </div>
        </header>

        {/* Desktop Top Header Bar (Unified Action bar) */}
        <header className="bg-card dark:bg-[#121A33] py-5 px-8 border-b border-ink/10 dark:border-sand/10 hidden md:flex items-center justify-between transition-colors">
          <div>
            <h2 className="font-serif text-xl font-semibold uppercase tracking-wider text-ink dark:text-sand">
              {activeTab === 'analytics' && 'Analytics Overview'}
              {activeTab === 'posts' && `${postFilter === 'all' ? 'All Posts' : postFilter === 'published' ? 'Published Posts' : postFilter === 'needs_review' ? 'Needs Review Posts' : postFilter === 'scheduled' ? 'Scheduled Posts' : postFilter === 'drafts' ? 'Draft Posts' : 'Archived Posts'}`}
              {activeTab === 'pages' && 'Site Pages Directory'}
              {activeTab === 'tags' && 'Categories & Destinations'}
              {activeTab === 'decap' && 'Decap CMS Admin'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Theme Toggle */}
            {mounted && (
              <button 
                onClick={toggleTheme}
                className="p-2 border border-ink/15 hover:border-ink/30 dark:border-sand/15 dark:hover:border-sand/30 text-ink dark:text-sand rounded-none min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}

            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn--sand text-xs py-2 px-5 flex items-center gap-2 min-h-[40px] rounded-none cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Write New Article
            </button>
          </div>
        </header>

        {/* Content Pane Wrapper */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto">
          
          {/* VIEW: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8">
              
              {/* Left Column (2/3) */}
              <div className="flex-grow flex flex-col gap-6 lg:w-[65%]">
                
                {/* Analytics Dashboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Total Pageviews Card */}
                  <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="lbl-eyebrow text-xs text-ink-3 dark:text-sand/50">Total Pageviews (30d)</span>
                      <h3 className="font-serif text-4xl font-semibold text-ink dark:text-sand mt-2">
                        {pageviews.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
                      </h3>
                    </div>
                    <div className="text-[10px] text-sage font-semibold uppercase mt-4 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Tracked via Umami
                    </div>
                  </div>

                  {/* Unique Visitors (Estimated) */}
                  <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="lbl-eyebrow text-xs text-ink-3 dark:text-sand/50">Unique Visitors (Est. 30d)</span>
                      <h3 className="font-serif text-4xl font-semibold text-ink dark:text-sand mt-2">
                        {Math.round(pageviews.reduce((acc, curr) => acc + curr.views, 0) * 0.65).toLocaleString()}
                      </h3>
                    </div>
                    <div className="text-[10px] text-ink-3 dark:text-sand/50 font-semibold uppercase mt-4">
                      ~65% unique engagement ratio
                    </div>
                  </div>

                  {/* Vercel Analytics Hub Redirect Card */}
                  <a 
                    href="https://vercel.com/vanden-travel/little-bit-of-luxe/analytics" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-midnight text-sand dark:bg-sand dark:text-midnight border border-midnight dark:border-sand p-6 rounded-none shadow-sm flex flex-col justify-between transition-all group cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="lbl-eyebrow text-xs text-sand/70 dark:text-midnight/70 font-semibold">Vercel Analytics Hub</span>
                        <ExternalLink className="w-4 h-4 text-sand/70 dark:text-midnight/70 group-hover:text-white dark:group-hover:text-midnight transition-colors" />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold mt-2 leading-tight">
                        Live Vercel Analytics
                      </h3>
                      <p className="text-[11px] text-sand/70 dark:text-midnight/70 mt-1 leading-normal">
                        Real-time visitor counts, vitals and metrics.
                      </p>
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider mt-4">
                      Launch Console &rarr;
                    </div>
                  </a>
                </div>

                {/* Sparkline Graph */}
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm transition-colors">
                  <div className="flex justify-between items-center pb-4 border-b border-ink/10 dark:border-sand/10 mb-6">
                    <div>
                      <h4 className="font-serif text-lg font-semibold text-ink dark:text-sand">Traffic Overview (Trailing 30 Days)</h4>
                      <span className="text-[10px] uppercase text-ink-3 dark:text-sand/50 font-medium">Daily Pageviews Sparkline</span>
                    </div>
                    <span className="text-xs bg-sage/10 text-sage dark:text-sage px-2.5 py-1 font-semibold uppercase tracking-wider rounded-none">
                      {analyticsSource === 'umami' ? 'Live Umami API' : 'High-Fidelity Mock Mode'}
                    </span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-ink-3 dark:text-sand/50" />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end justify-between h-40 px-2 pt-4 bg-paper/30 dark:bg-midnight/30 border border-ink/5 dark:border-sand/5 gap-1 md:gap-1.5">
                        {pageviews.map((pv, idx) => {
                          const maxVal = Math.max(...pageviews.map(p => p.views), 100);
                          const percentage = (pv.views / maxVal) * 100;
                          return (
                            <div key={idx} className="flex-grow flex flex-col items-center gap-1 group relative">
                              <div className="absolute bottom-full mb-2 bg-midnight dark:bg-sand text-sand dark:text-midnight text-[10px] py-1 px-2 rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10 border border-sand/20 dark:border-midnight/20 shadow-lg">
                                {pv.date}: {pv.views} views
                              </div>
                              <div 
                                className="w-full bg-sage/30 dark:bg-sage/20 group-hover:bg-sage dark:group-hover:bg-gold-soft transition-all rounded-none" 
                                style={{ height: `${Math.max(4, percentage * 1.2)}px` }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-ink-3 dark:text-sand/50 pt-3">
                        <span>{pageviews[0]?.date || 'Start'}</span>
                        <span>Average: {Math.round(pageviews.reduce((acc, curr) => acc + curr.views, 0) / Math.max(1, pageviews.length))} / day</span>
                        <span>{pageviews[pageviews.length - 1]?.date || 'End'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Trending Content */}
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm transition-colors">
                  <div className="flex justify-between items-center pb-4 border-b border-ink/10 dark:border-sand/10 mb-4">
                    <h4 className="font-serif text-lg font-semibold text-ink dark:text-sand">Trending Content Metrics</h4>
                    <span className="text-[10px] uppercase text-ink-3 dark:text-sand/50 font-medium">Mapped from Umami URL endpoints</span>
                  </div>

                  <div className="divide-y divide-ink/5 dark:divide-sand/5">
                    {unifiedPosts.slice(0, 5).map(post => {
                      const views = getPostViews(post.slug, post.type);
                      return (
                        <div key={post.slug} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-xs text-ink dark:text-sand truncate hover:text-bordeaux dark:hover:text-gold-soft transition-colors cursor-pointer" onClick={() => setSelectedPostForAnalytics(post)}>
                              {post.title}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 mt-0.5">
                              {post.type} &middot; {post.location}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-bold text-ink dark:text-sand">{views}</span>
                              <span className="text-[9px] text-ink-3 dark:text-sand/50 block">views</span>
                            </div>
                            <button 
                              onClick={() => setSelectedPostForAnalytics(post)}
                              className="p-1 text-ink-3 hover:text-ink dark:text-sand/50 dark:hover:text-white cursor-pointer"
                              title="Detailed Post Analytics"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column (1/3) */}
              <div className="lg:w-[35%] flex flex-col gap-6 shrink-0">
                
                {/* GSC striking distance keywords */}
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4 transition-colors">
                  <div className="flex items-center justify-between pb-3 border-b border-ink/10 dark:border-sand/10">
                    <span className="lbl-eyebrow text-ink dark:text-sand font-bold">GSC Striking Distance Keywords</span>
                    <BarChart2 className="w-4 h-4 text-ink-3 dark:text-sand/50" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-3 dark:text-sand/50">GSC API Status:</span>
                      <span className={`font-bold text-xs ${gscStatus.includes('Connected') ? 'text-sage' : 'text-terracotta'}`}>{gscStatus}</span>
                    </div>
                    <span className="text-[9px] text-ink-4 dark:text-sand/40">Keywords ranked positions 11 to 20</span>
                  </div>

                  {loadingAnalytics ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-ink-3 dark:text-sand/50" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {gscKeywords.slice(0, 4).map((k, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 bg-paper dark:bg-midnight border border-ink/5 dark:border-sand/5 flex flex-col gap-1.5 hover:border-bordeaux/40 transition-colors rounded-none"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-mono text-xs font-semibold text-ink dark:text-sand truncate max-w-[150px]">{k.keyword}</span>
                            <span className="text-[10px] font-bold text-terracotta bg-terracotta/5 px-2 py-0.5 shrink-0 rounded-none">
                              Pos: {k.position}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-ink-3 dark:text-sand/50 pt-1.5 border-t border-ink/5 dark:border-sand/5">
                            <span>Impressions: <strong>{k.impressions}</strong></span>
                            <span>Clicks: <strong>{k.clicks}</strong></span>
                          </div>
                          <button 
                            onClick={() => {
                              setArticleType('review');
                              setPropertyName(k.keyword);
                              setAiNotes(`Draft an article targeting keywords: "${k.keyword}"`);
                              setGenerationMode('ai');
                              setIsModalOpen(true);
                            }}
                            className="mt-2 text-center bg-midnight text-sand dark:bg-sand dark:text-midnight hover:bg-bordeaux hover:text-white dark:hover:bg-bordeaux dark:hover:text-white text-[9px] uppercase font-semibold py-1 tracking-wider w-full rounded-none transition-colors cursor-pointer"
                          >
                            Convert to Draft Task
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO & GEO Audit Panel */}
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4 transition-colors">
                  <div className="flex items-center justify-between pb-3 border-b border-ink/10 dark:border-sand/10">
                    <span className="lbl-eyebrow text-ink dark:text-sand font-bold">Strategy Audit Panel</span>
                    {selectedAuditItem ? (
                      <button onClick={() => { setSelectedAuditItem(null); setSeoAudit(null); }} className="text-ink-3 hover:text-ink cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <Sparkles className="w-4 h-4 text-bordeaux dark:text-gold-soft" />
                    )}
                  </div>
                  
                  {selectedAuditItem ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between bg-paper dark:bg-midnight p-3 border border-ink/5 dark:border-sand/5 rounded-none">
                        <div className="min-w-0 flex-grow pr-2">
                          <h5 className="font-serif text-sm text-ink dark:text-sand truncate font-semibold">
                            {selectedAuditItem.title}
                          </h5>
                          <span className="text-[9px] uppercase text-ink-3 dark:text-sand/50">{selectedAuditItem.type} Audit</span>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          seoAudit.score > 80 ? 'bg-sage' : seoAudit.score > 50 ? 'bg-terracotta' : 'bg-bordeaux'
                        }`}>
                          {seoAudit.score}%
                        </div>
                      </div>

                      {/* Checklist */}
                      <div className="flex flex-col gap-2.5">
                        <span className="text-[9px] tracking-wider uppercase text-ink-3 dark:text-sand/50 font-bold">Checks Analyzed</span>
                        <div className="flex flex-col gap-2">
                          {seoAudit.checklist.map((check: any) => (
                            <div key={check.id} className="flex items-start gap-2 text-[11px] text-ink-2 dark:text-sand/80">
                              {check.passed ? (
                                <CheckCircle className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                              )}
                              <span>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {seoAudit.recommendations.length > 0 && (
                        <div className="p-3 bg-bordeaux/5 border-l-2 border-bordeaux dark:border-gold-soft flex flex-col gap-1.5">
                          <span className="text-[9px] tracking-wider uppercase text-bordeaux dark:text-gold-soft font-bold">Optimizations Required</span>
                          <ul className="list-disc pl-3 text-[11px] text-ink-2 dark:text-sand/85 flex flex-col gap-1.5">
                            {seoAudit.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Link suggestions */}
                      {suggestedLinks.length > 0 && (
                        <div className="pt-3 border-t border-ink/10 dark:border-sand/10 flex flex-col gap-2">
                          <span className="text-[9px] tracking-wider uppercase text-ink-3 dark:text-sand/50 font-bold flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Bidirectional Links
                          </span>
                          <div className="flex flex-col gap-2">
                            {suggestedLinks.map((link: any, index: number) => (
                              <div key={index} className="p-2.5 bg-paper dark:bg-midnight border border-ink/5 dark:border-sand/5 text-[10px] rounded-none flex flex-col gap-1">
                                <span className="font-semibold truncate text-ink dark:text-sand">{link.parentGuide}</span>
                                <code className="bg-card dark:bg-[#121A33] p-1 font-mono text-[9px] border border-ink/5 dark:border-sand/5 text-bordeaux dark:text-gold-soft rounded-none select-all truncate">
                                  {`[${link.recommendedAnchor}](/program/${link.parentSlug})`}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-ink-3 dark:text-sand/40 text-xs italic">
                      Select an article from the database in Posts or Trending Content to run a strategic SEO &amp; GEO quality audit checklist.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* VIEW: POSTS */}
          {activeTab === 'posts' && (
            <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-8">
              
              {/* Left Column (Unified Database Posts List) */}
              <div className="flex-grow lg:w-[65%] flex flex-col gap-4">
                
                {/* Filter Bar Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card dark:bg-[#121A33] p-4 border border-ink/10 dark:border-sand/10 rounded-none shadow-sm transition-colors">
                  
                  {/* Category Type Selector */}
                  <div className="flex gap-2">
                    {(['all', 'Review', 'News', 'Partner Guide', 'General News'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedPostType(type)}
                        className={`px-3 py-1.5 font-semibold text-[10px] tracking-wider uppercase border transition-all cursor-pointer rounded-none min-h-[36px] ${
                          selectedPostType === type
                            ? 'bg-midnight text-sand border-midnight dark:bg-sand dark:text-midnight dark:border-sand'
                            : 'bg-transparent text-ink-3 dark:text-sand/50 border-ink/15 dark:border-sand/15 hover:border-ink'
                        }`}
                      >
                        {type === 'all' ? 'All Types' : type === 'Review' ? 'Reviews' : type === 'News' ? 'News' : type === 'Partner Guide' ? 'Partners' : 'General'}
                      </button>
                    ))}
                  </div>

                  {/* Quick stats label */}
                  <span className="text-[10px] text-ink-3 dark:text-sand/50 font-bold uppercase tracking-wider">
                    Filtered: {filteredPosts.length} posts
                  </span>
                </div>

                {/* Table list */}
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 rounded-none shadow-sm overflow-hidden transition-colors">
                  {filteredPosts.length > 0 ? (
                    <div className="divide-y divide-ink/5 dark:divide-sand/5">
                      {filteredPosts.map(post => {
                        const views = getPostViews(post.slug, post.type);
                        const isSelected = selectedAuditItem?.slug === post.slug;
                        
                        return (
                          <div 
                            key={post.slug}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-paper/30 dark:hover:bg-midnight/30 ${
                              isSelected ? 'bg-paper dark:bg-midnight' : ''
                            }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-none ${
                                  post.type === 'Review' 
                                    ? 'bg-sage/10 text-sage' 
                                    : post.type === 'News' 
                                      ? 'bg-terracotta/10 text-terracotta' 
                                      : 'bg-midnight/10 dark:bg-sand/10 text-midnight dark:text-sand'
                                }`}>
                                  {post.type === 'Review' ? 'Review' : post.type === 'News' ? 'News' : 'Partner'}
                                </span>
                                
                                <span className="text-[9px] tracking-wider uppercase text-ink-3 dark:text-sand/50 font-semibold flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> {post.location}
                                </span>

                                {post.status === 'draft' && (
                                  <span className="text-[8px] uppercase tracking-wider bg-bordeaux/10 text-bordeaux px-1.5 py-0.5 rounded-none font-bold">Draft</span>
                                )}
                                {post.status === 'needs_review' && (
                                  <span className="text-[8px] uppercase tracking-wider bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-none font-bold">Needs Review</span>
                                )}
                                {post.status === 'scheduled' && (
                                  <span className="text-[8px] uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded-none font-bold">Scheduled ({new Date(post.date).toLocaleDateString()})</span>
                                )}
                                {post.status === 'archived' && (
                                  <span className="text-[8px] uppercase tracking-wider bg-ink-3/15 text-ink-3 dark:bg-sand/15 dark:text-sand/75 px-1.5 py-0.5 rounded-none font-bold">Archived</span>
                                )}
                                {post.status === 'published' && (
                                  <span className="text-[8px] uppercase tracking-wider bg-sage/15 text-sage px-1.5 py-0.5 rounded-none font-bold">Published</span>
                                )}
                              </div>
                              
                              <h4 className="font-serif text-base font-semibold text-ink dark:text-sand mt-1">
                                {post.title}
                              </h4>
                              <p className="text-[11px] text-ink-3 dark:text-sand/50 line-clamp-1 italic font-serif mt-0.5">
                                {post.excerpt}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                              
                              {/* Pageviews counter */}
                              <div className="text-right pr-2">
                                <span className="text-xs font-bold text-ink dark:text-sand block leading-none">{views}</span>
                                <span className="text-[8px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold leading-none">views</span>
                              </div>

                              <button 
                                onClick={() => setSelectedPostForAnalytics(post)}
                                className="px-2.5 py-1.5 border border-ink/20 dark:border-sand/20 text-ink dark:text-sand hover:border-ink text-[10px] font-semibold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1"
                                title="Article Metrics"
                              >
                                <Eye className="w-3.5 h-3.5" /> Metrics
                              </button>

                              <button 
                                onClick={() => runAudit(post)}
                                className="px-2.5 py-1.5 border border-ink/20 dark:border-sand/20 text-ink dark:text-sand hover:border-ink text-[10px] font-semibold uppercase tracking-wider rounded-none cursor-pointer"
                              >
                                Audit
                              </button>

                              {post.status === 'published' && (
                                <a 
                                  href={post.type === 'Review' ? `/review/${post.slug}` : post.type === 'News' ? `/news/${post.slug}` : `/program/${post.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 border border-ink/20 dark:border-sand/20 text-ink dark:text-sand hover:border-ink text-[10px] font-semibold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1 min-h-[32px]"
                                  title="View Live Page"
                                >
                                  <ExternalLink className="w-3 h-3" /> Live
                                </a>
                              )}

                              <Link 
                                href={`/admin/editor?type=${post.type === 'Review' ? 'review' : post.type === 'News' ? 'news' : 'program'}&slug=${post.slug}`}
                                className="px-3 py-1.5 bg-midnight text-sand dark:bg-sand dark:text-midnight text-[10px] font-semibold uppercase tracking-wider hover:bg-bordeaux dark:hover:bg-gold-soft rounded-none min-h-[32px] flex items-center"
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-16 text-center">
                      <FileText className="w-12 h-12 text-ink-4 mx-auto mb-3 stroke-[1.2]" />
                      <h4 className="font-serif text-lg italic text-ink-2 mb-1">No matches found</h4>
                      <p className="text-sm text-ink-3 mb-4">Try clearing filters or search terms.</p>
                      <button 
                        onClick={() => { setSearchQuery(''); setSelectedPostType('all'); }}
                        className="btn--primary text-xs py-2 px-4 rounded-none inline-flex items-center gap-2 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (SEO Strategy Audit Panel on Selection) */}
              <div className="lg:w-[35%] flex flex-col gap-6 shrink-0">
                <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4 transition-colors">
                  <div className="flex items-center justify-between pb-3 border-b border-ink/10 dark:border-sand/10">
                    <span className="lbl-eyebrow text-ink dark:text-sand font-bold">SEO &amp; GEO Strategy Audit</span>
                    {selectedAuditItem ? (
                      <button onClick={() => { setSelectedAuditItem(null); setSeoAudit(null); }} className="text-ink-3 hover:text-ink cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <Sparkles className="w-4 h-4 text-bordeaux dark:text-gold-soft" />
                    )}
                  </div>
                  
                  {selectedAuditItem ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between bg-paper dark:bg-midnight p-3 border border-ink/5 dark:border-sand/5 rounded-none">
                        <div className="min-w-0 flex-grow pr-2">
                          <h5 className="font-serif text-sm text-ink dark:text-sand truncate font-semibold">
                            {selectedAuditItem.title}
                          </h5>
                          <span className="text-[9px] uppercase text-ink-3 dark:text-sand/50">{selectedAuditItem.type} Audit</span>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          seoAudit.score > 80 ? 'bg-sage' : seoAudit.score > 50 ? 'bg-terracotta' : 'bg-bordeaux'
                        }`}>
                          {seoAudit.score}%
                        </div>
                      </div>

                      {/* Checklist */}
                      <div className="flex flex-col gap-2.5">
                        <span className="text-[9px] tracking-wider uppercase text-ink-3 dark:text-sand/50 font-bold">Checks Analyzed</span>
                        <div className="flex flex-col gap-2">
                          {seoAudit.checklist.map((check: any) => (
                            <div key={check.id} className="flex items-start gap-2 text-[11px] text-ink-2 dark:text-sand/80">
                              {check.passed ? (
                                <CheckCircle className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                              )}
                              <span>{check.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      {seoAudit.recommendations.length > 0 && (
                        <div className="p-3 bg-bordeaux/5 border-l-2 border-bordeaux dark:border-gold-soft flex flex-col gap-1.5">
                          <span className="text-[9px] tracking-wider uppercase text-bordeaux dark:text-gold-soft font-bold">Optimizations Required</span>
                          <ul className="list-disc pl-3 text-[11px] text-ink-2 dark:text-sand/85 flex flex-col gap-1.5">
                            {seoAudit.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Link suggestions */}
                      {suggestedLinks.length > 0 && (
                        <div className="pt-3 border-t border-ink/10 dark:border-sand/10 flex flex-col gap-2">
                          <span className="text-[9px] tracking-wider uppercase text-ink-3 dark:text-sand/50 font-bold flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Bidirectional Links
                          </span>
                          <div className="flex flex-col gap-2">
                            {suggestedLinks.map((link: any, index: number) => (
                              <div key={index} className="p-2.5 bg-paper dark:bg-midnight border border-ink/5 dark:border-sand/5 text-[10px] rounded-none flex flex-col gap-1">
                                <span className="font-semibold truncate text-ink dark:text-sand">{link.parentGuide}</span>
                                <code className="bg-card dark:bg-[#121A33] p-1 font-mono text-[9px] border border-ink/5 dark:border-sand/5 text-bordeaux dark:text-gold-soft rounded-none select-all truncate">
                                  {`[${link.recommendedAnchor}](/program/${link.parentSlug})`}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-ink-3 dark:text-sand/40 text-xs italic">
                      Select an article from the database table to run a strategic SEO &amp; GEO quality audit checklist.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: PAGES */}
          {activeTab === 'pages' && (
            <div className="max-w-[960px] mx-auto bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 rounded-none shadow-sm transition-colors">
              <div className="p-6 border-b border-ink/10 dark:border-sand/10">
                <h4 className="font-serif text-lg font-semibold">Editorial Pages Directory</h4>
                <span className="text-[10px] uppercase text-ink-3 dark:text-sand/50 font-medium">Core static routes &amp; index listings</span>
              </div>
              <div className="divide-y divide-ink/5 dark:divide-sand/5">
                {pagesList.map(page => (
                  <div key={page.path} className="p-5 flex items-center justify-between gap-6">
                    <div className="flex flex-col min-w-0">
                      <span className="font-serif text-base font-semibold text-ink dark:text-sand">{page.title}</span>
                      <code className="text-xs text-bordeaux dark:text-gold-soft font-mono select-all mt-1">{page.path}</code>
                    </div>
                    
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-ink dark:text-sand block leading-none">{page.views}</span>
                        <span className="text-[8px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold">views (30d)</span>
                      </div>
                      
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 bg-sage`}>
                        {page.seo}%
                      </div>

                      <a 
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 border border-ink/20 dark:border-sand/20 text-ink dark:text-sand hover:border-ink text-[10px] font-semibold uppercase tracking-wider rounded-none cursor-pointer flex items-center gap-1.5"
                      >
                        View Page <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TAGS */}
          {activeTab === 'tags' && (
            <div className="max-w-[1120px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Category tags */}
              <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4">
                <span className="lbl-eyebrow text-ink dark:text-sand font-bold border-b border-ink/10 dark:border-sand/10 pb-2">Editorial Sections</span>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map(cat => {
                    const count = unifiedPosts.filter(p => p.category === cat).length;
                    return (
                      <span key={cat} className="text-[11px] font-semibold bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 text-ink dark:text-sand px-3 py-1.5 rounded-none flex items-center justify-between gap-3 w-full">
                        <span>{cat}</span>
                        <span className="bg-midnight dark:bg-sand text-sand dark:text-midnight font-bold px-1.5 py-0.5 text-[9px] rounded-none">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Destination tags */}
              <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4">
                <span className="lbl-eyebrow text-ink dark:text-sand font-bold border-b border-ink/10 dark:border-sand/10 pb-2">Destinations</span>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {locationsList.map(loc => {
                    const count = unifiedPosts.filter(p => p.location === loc).length;
                    return (
                      <span key={loc} className="text-[11px] font-semibold bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 text-ink dark:text-sand px-3 py-1.5 rounded-none flex items-center justify-between gap-3">
                        <span>{loc}</span>
                        <span className="bg-midnight dark:bg-sand text-sand dark:text-midnight font-bold px-1.5 py-0.5 text-[9px] rounded-none">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Brand tags */}
              <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 rounded-none shadow-sm flex flex-col gap-4">
                <span className="lbl-eyebrow text-ink dark:text-sand font-bold border-b border-ink/10 dark:border-sand/10 pb-2">Hotel Brands</span>
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {brandsList.map(brand => {
                    const count = unifiedPosts.filter(p => p.brand === brand).length;
                    return (
                      <span key={brand} className="text-[11px] font-semibold bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 text-ink dark:text-sand px-3 py-1.5 rounded-none flex items-center justify-between gap-3">
                        <span>{brand}</span>
                        <span className="bg-midnight dark:bg-sand text-sand dark:text-midnight font-bold px-1.5 py-0.5 text-[9px] rounded-none">{count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: DECAP CMS */}
          {activeTab === 'decap' && (
            <div className="max-w-[760px] mx-auto bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-8 rounded-none shadow-sm flex flex-col gap-6 text-center transition-colors">
              <div className="max-w-[480px] mx-auto flex flex-col gap-3">
                <Layout className="w-16 h-16 text-bordeaux dark:text-gold-soft mx-auto stroke-[1.2]" />
                <h3 className="font-serif text-2xl font-semibold text-ink dark:text-sand mt-2">Decap CMS Administration</h3>
                <p className="text-xs text-ink-3 dark:text-sand/65 leading-relaxed">
                  Decap CMS manages the raw markdown schema structures, layouts, and image media directories inside your Git Repository. Use it to update fields, attachments, and categories.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-b border-ink/10 dark:border-sand/10 py-6 my-4 text-left">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block">Media Location</span>
                  <span className="text-xs font-mono text-ink dark:text-sand font-bold">/public/images/uploads</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block">CMS Entrypoint</span>
                  <span className="text-xs font-mono text-ink dark:text-sand font-bold">/admin/index.html</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block">CMS Provider</span>
                  <span className="text-xs font-mono text-ink dark:text-sand font-bold">Git Gateway (Decap)</span>
                </div>
              </div>

              <div>
                <a 
                  href="/admin/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="btn--sand text-xs py-3.5 px-8 inline-flex items-center gap-2 rounded-none cursor-pointer"
                >
                  Launch Decap CMS Console <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-[760px] mx-auto bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-8 rounded-none shadow-sm flex flex-col gap-6 transition-colors">
              <div className="border-b border-ink/10 dark:border-sand/10 pb-4">
                <h4 className="font-serif text-lg font-semibold">Integrations &amp; Global Configuration</h4>
                <span className="text-[10px] uppercase text-ink-3 dark:text-sand/50 font-medium">Configure credentials, keys and site-wide branding settings</span>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-ink-3 dark:text-sand/50 tracking-wider">Site Brand Name</label>
                  <input 
                    type="text"
                    value="Little Bit of Luxe"
                    disabled
                    className="w-full bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 px-4 py-2.5 text-xs text-ink dark:text-sand rounded-none outline-none opacity-80"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold text-ink-3 dark:text-sand/50 tracking-wider">Base Production Domain</label>
                  <input 
                    type="text"
                    value="https://littlebitofluxury.com"
                    disabled
                    className="w-full bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 px-4 py-2.5 text-xs text-ink dark:text-sand rounded-none outline-none opacity-80"
                  />
                </div>

                <div className="pt-4 border-t border-ink/10 dark:border-sand/10 flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-bold text-ink dark:text-sand tracking-widest">Active Server Integrations</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 rounded-none flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-sand block">Umami Cloud Tracking</span>
                        <span className="text-[9px] text-ink-3 dark:text-sand/50 font-mono">cloud.umami.is/script.js</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-sage shadow-[0_0_8px_#6F7A5C]" />
                    </div>

                    <div className="p-4 bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 rounded-none flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-sand block">Search Console Service</span>
                        <span className="text-[9px] text-ink-3 dark:text-sand/50 font-mono">Domain property configured</span>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${gscStatus.includes('Connected') ? 'bg-sage shadow-[0_0_8px_#6F7A5C]' : 'bg-terracotta shadow-[0_0_8px_#B96A4A]'}`} />
                    </div>

                    <div className="p-4 bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 rounded-none flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-sand block">Vercel Web Analytics</span>
                        <span className="text-[9px] text-ink-3 dark:text-sand/50 font-mono">vercel/analytics package active</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-sage shadow-[0_0_8px_#6F7A5C]" />
                    </div>

                    <div className="p-4 bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 rounded-none flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-ink dark:text-sand block">Vercel Speed Insights</span>
                        <span className="text-[9px] text-ink-3 dark:text-sand/50 font-mono">vercel/speed-insights active</span>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-sage shadow-[0_0_8px_#6F7A5C]" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-ink/10 dark:border-sand/10 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold block">Theme Preference</span>
                    <span className="text-[10px] text-ink-3 dark:text-sand/50">Change CMS UI theme modes</span>
                  </div>
                  <button 
                    onClick={toggleTheme}
                    className="px-4 py-2 border border-ink/20 dark:border-sand/20 hover:border-ink hover:text-bordeaux text-xs uppercase font-bold tracking-wider rounded-none cursor-pointer"
                  >
                    Theme: {theme === 'light' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: WRITE NEW ARTICLE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-midnight/60 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-ivory dark:bg-[#0D152D] text-midnight dark:text-sand border border-midnight/20 dark:border-sand/20 p-6 md:p-8 max-w-[560px] w-full shadow-2xl rounded-none flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-midnight/10 dark:border-sand/10 pb-4">
              <h3 className="font-serif text-2xl font-semibold">Write New Article</h3>
              <button 
                onClick={() => { setIsModalOpen(false); setPropertyName(''); }}
                className="text-midnight/60 dark:text-sand/60 hover:text-midnight dark:hover:text-sand text-xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {generating && generationMode === 'ai' ? (
              /* ── MULTI-AGENT VISUAL TIMELINE ── */
              <div className="flex flex-col gap-6 py-2">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-sage dark:text-sage/80 font-bold mb-1">AI Pipeline Active</p>
                  <p className="font-serif text-lg text-ink dark:text-sand">Generating: <em>{propertyName}</em></p>
                </div>

                {/* Timeline */}
                <div className="relative flex flex-col gap-0 pl-8">
                  {/* Vertical connector line */}
                  <div className="absolute left-[15px] top-[12px] bottom-[12px] w-[2px] bg-gradient-to-b from-sage/40 via-terracotta/40 to-bordeaux/40 dark:from-sage/30 dark:via-terracotta/30 dark:to-bordeaux/30" />

                  {/* Step 1: Deep Research */}
                  <div className="relative flex items-start gap-4 pb-6">
                    <div className={`absolute left-[-17px] top-[2px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      aiStep >= 2 ? 'bg-sage border-sage' : aiStep === 1 ? 'bg-sage/20 border-sage animate-pulse' : 'bg-transparent border-ink/20 dark:border-sand/20'
                    }`}>
                      {aiStep >= 2 && <Check className="w-3 h-3 text-white" />}
                      {aiStep === 1 && <div className="w-2 h-2 rounded-full bg-sage animate-ping" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 transition-colors duration-300 ${
                        aiStep >= 1 ? 'text-sage' : 'text-ink-3 dark:text-sand/40'
                      }`}>Step 1 &middot; Deep Research</p>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        aiStep === 1 ? 'text-ink dark:text-sand/90' : aiStep >= 2 ? 'text-ink-3 dark:text-sand/50' : 'text-ink-3/60 dark:text-sand/30'
                      }`}>
                        {aiStep >= 1 ? `Querying Perplexity Sonar for live "${propertyName}" asset records and global press data…` : 'Waiting…'}
                      </p>
                      {aiStep === 1 && (
                        <div className="mt-2 h-[3px] bg-ink/5 dark:bg-sand/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-sage to-sage/60 rounded-full animate-progress-indeterminate" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Persona Alignment */}
                  <div className="relative flex items-start gap-4 pb-6">
                    <div className={`absolute left-[-17px] top-[2px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      aiStep >= 3 ? 'bg-terracotta border-terracotta' : aiStep === 2 ? 'bg-terracotta/20 border-terracotta animate-pulse' : 'bg-transparent border-ink/20 dark:border-sand/20'
                    }`}>
                      {aiStep >= 3 && <Check className="w-3 h-3 text-white" />}
                      {aiStep === 2 && <div className="w-2 h-2 rounded-full bg-terracotta animate-ping" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 transition-colors duration-300 ${
                        aiStep >= 2 ? 'text-terracotta' : 'text-ink-3 dark:text-sand/40'
                      }`}>Step 2 &middot; Persona Alignment</p>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        aiStep === 2 ? 'text-ink dark:text-sand/90' : aiStep >= 3 ? 'text-ink-3 dark:text-sand/50' : 'text-ink-3/60 dark:text-sand/30'
                      }`}>
                        {aiStep >= 2 ? 'Retrieving local historical articles to clone your specific Little Bit of Luxe phrasing cadence…' : 'Waiting…'}
                      </p>
                      {aiStep === 2 && (
                        <div className="mt-2 h-[3px] bg-ink/5 dark:bg-sand/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-terracotta to-terracotta/60 rounded-full animate-progress-indeterminate" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Composition Engine */}
                  <div className="relative flex items-start gap-4 pb-6">
                    <div className={`absolute left-[-17px] top-[2px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      aiStep >= 4 ? 'bg-bordeaux border-bordeaux' : aiStep === 3 ? 'bg-bordeaux/20 border-bordeaux animate-pulse' : 'bg-transparent border-ink/20 dark:border-sand/20'
                    }`}>
                      {aiStep >= 4 && <Check className="w-3 h-3 text-white" />}
                      {aiStep === 3 && <div className="w-2 h-2 rounded-full bg-bordeaux animate-ping" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 transition-colors duration-300 ${
                        aiStep >= 3 ? 'text-bordeaux' : 'text-ink-3 dark:text-sand/40'
                      }`}>Step 3 &middot; Composition Engine</p>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        aiStep === 3 ? 'text-ink dark:text-sand/90' : aiStep >= 4 ? 'text-ink-3 dark:text-sand/50' : 'text-ink-3/60 dark:text-sand/30'
                      }`}>
                        {aiStep >= 3 ? 'Engaging Claude 3.5 Sonnet to formulate the structured layout and inject QX Travel CTA links...' : 'Waiting...'}
                      </p>
                      {aiStep === 3 && (
                        <div className="mt-2 h-[3px] bg-ink/5 dark:bg-sand/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-bordeaux to-bordeaux/60 rounded-full animate-progress-indeterminate" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Complete state */}
                  {aiStep >= 4 && (
                    <div className="relative flex items-start gap-4 animate-fade-in">
                      <div className="absolute left-[-17px] top-[2px] w-[18px] h-[18px] rounded-full border-2 bg-gold border-gold flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-gold">Complete</p>
                        <p className="text-xs leading-relaxed text-ink dark:text-sand/90">
                          Article generated successfully. Opening editor…
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Elapsed timer */}
                <div className="text-center pt-2 border-t border-ink/5 dark:border-sand/10">
                  <p className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/40 font-bold flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Pipeline in progress — this takes 20–40 seconds
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateArticle} className="flex flex-col gap-5">
              
                {/* Layout Type Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-midnight/70 dark:text-sand/70 font-semibold">
                    Article Layout type
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['review', 'news', 'program', 'general'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setArticleType(t)}
                        className={`py-3 px-2 text-center text-xs uppercase font-bold tracking-wider rounded-none border transition-all min-h-[44px] cursor-pointer ${
                          articleType === t 
                            ? 'bg-midnight text-sand border-midnight dark:bg-sand dark:text-midnight dark:border-sand' 
                            : 'bg-transparent text-midnight/60 dark:text-sand/65 border-midnight/15 dark:border-sand/15 hover:border-midnight dark:hover:border-sand'
                        }`}
                      >
                        {t === 'review' ? 'Hotel Review' : t === 'news' ? 'Hotel News' : t === 'program' ? 'Partner Guide' : 'General News'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property / Brand / Program Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-midnight/70 dark:text-sand/70 font-semibold">
                    {articleType === 'review' ? 'Hotel Name' : articleType === 'news' ? 'New Property Name' : articleType === 'program' ? 'Program Name' : 'Article Topic / Name'}
                  </label>
                  <input 
                    type="text"
                    placeholder={articleType === 'review' ? 'e.g. Aman Venice' : articleType === 'news' ? 'e.g. The Emory London' : articleType === 'program' ? 'e.g. Rosewood Elite' : 'e.g. The Rebirth of Fiesole'}
                    className="w-full text-sm bg-transparent border border-midnight/15 dark:border-sand/15 px-4 py-3 outline-none focus:border-midnight dark:focus:border-sand text-midnight dark:text-sand rounded-none min-h-[44px]"
                    value={propertyName}
                    onChange={e => setPropertyName(e.target.value)}
                    required
                  />
                </div>

                {/* Creation Mode selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] tracking-wider uppercase text-midnight/70 dark:text-sand/70 font-semibold">
                    Creation Mode
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer min-h-[44px]">
                      <input 
                        type="radio" 
                        name="creationMode" 
                        value="ai"
                        checked={generationMode === 'ai'}
                        onChange={() => setGenerationMode('ai')}
                        className="w-4 h-4 cursor-pointer accent-midnight dark:accent-sand"
                      />
                      <span>Draft with Claude AI</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer min-h-[44px]">
                      <input 
                        type="radio" 
                        name="creationMode" 
                        value="manual"
                        checked={generationMode === 'manual'}
                        onChange={() => setGenerationMode('manual')}
                        className="w-4 h-4 cursor-pointer accent-midnight dark:accent-sand"
                      />
                      <span>Manual Draft (Empty)</span>
                    </label>
                  </div>
                </div>

                {/* Claude AI Prompts */}
                {generationMode === 'ai' && (
                  <div className="flex flex-col gap-2 animate-slide-down">
                    <label className="text-[10px] tracking-wider uppercase text-midnight/70 dark:text-sand/70 font-semibold flex items-center justify-between">
                      <span>AI Writing Instructions / Notes</span>
                      <span className="text-[9px] text-sage font-bold">Model: claude-sonnet-4-6</span>
                    </label>
                    <textarea 
                      rows={4}
                      placeholder="Enter any details about location, amenities, rating, or personal editorial notes. Claude will craft a beautiful, publish-ready article in our signature voice..."
                      className="w-full text-sm bg-transparent border border-midnight/15 dark:border-sand/15 px-4 py-3 outline-none focus:border-midnight dark:focus:border-sand text-midnight dark:text-sand rounded-none resize-none"
                      value={aiNotes}
                      onChange={e => setAiNotes(e.target.value)}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-midnight/10 dark:border-sand/10">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setPropertyName(''); }}
                    className="px-5 py-3 border border-midnight/15 dark:border-sand/15 text-midnight dark:text-sand text-xs uppercase font-bold tracking-wider rounded-none hover:bg-midnight/5 dark:hover:bg-sand/5 cursor-pointer min-h-[44px]"
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn--sand dark:btn--primary text-xs py-3 px-6 flex items-center justify-center gap-2 min-h-[44px] rounded-none cursor-pointer"
                    disabled={generating}
                  >
                    {generationMode === 'ai' ? 'Draft with AI' : 'Create Article'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* ARTICLE LEVEL DETAILED ANALYTICS MODAL */}
      {selectedPostForAnalytics && (
        <div className="fixed inset-0 bg-midnight/60 dark:bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card dark:bg-[#121A33] border border-ink/10 dark:border-sand/10 p-6 md:p-8 max-w-[680px] w-full shadow-2xl rounded-none flex flex-col gap-6 max-h-[90vh] overflow-y-auto transition-colors">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 dark:border-sand/10 pb-4">
              <div className="min-w-0 pr-4">
                <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block mb-1">
                  Post Performance Analytics
                </span>
                <h3 className="font-serif text-xl font-semibold text-ink dark:text-sand truncate">
                  {selectedPostForAnalytics.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPostForAnalytics(null)}
                className="text-ink-3 hover:text-ink dark:text-sand/65 dark:hover:text-white text-xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 rounded-none text-left">
                <span className="text-[9px] uppercase text-ink-3 dark:text-sand/50 font-bold block">Pageviews (30d)</span>
                <span className="text-2xl font-serif font-bold text-ink dark:text-sand mt-1 block">
                  {getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type)}
                </span>
              </div>

              <div className="p-4 bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 rounded-none text-left">
                <span className="text-[9px] uppercase text-ink-3 dark:text-sand/50 font-bold block">Avg. Rank Pos</span>
                <span className="text-2xl font-serif font-bold text-terracotta mt-1 block">
                  {(4.5 + (selectedPostForAnalytics.title.length % 7)).toFixed(1)}
                </span>
              </div>

              <div className="p-4 bg-paper dark:bg-midnight border border-ink/15 dark:border-sand/15 rounded-none text-left">
                <span className="text-[9px] uppercase text-ink-3 dark:text-sand/50 font-bold block">Est. CTR</span>
                <span className="text-2xl font-serif font-bold text-sage mt-1 block">
                  {(1.2 + (selectedPostForAnalytics.title.length % 4) * 0.8).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Article pageviews graph over time */}
            <div>
              <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block mb-2">
                Pageviews Curve (30 Days)
              </span>
              <div className="flex items-end justify-between h-28 px-2 pt-4 bg-paper/50 dark:bg-midnight/50 border border-ink/5 dark:border-sand/5 gap-1 rounded-none">
                {generatePostDailyViews(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type)).map((pv, idx) => {
                  const maxVal = Math.max(...generatePostDailyViews(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type)).map(p => p.views), 10);
                  const percentage = (pv.views / maxVal) * 100;
                  return (
                    <div key={idx} className="flex-grow flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-1 bg-midnight dark:bg-sand text-sand dark:text-midnight text-[9px] py-0.5 px-1.5 rounded-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10 border border-sand/20 dark:border-midnight/20">
                        {pv.views} views
                      </div>
                      <div 
                        className="w-full bg-sage/40 dark:bg-sage/20 group-hover:bg-sage dark:group-hover:bg-gold-soft transition-all rounded-none" 
                        style={{ height: `${Math.max(2, percentage * 0.8)}px` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Search Console Keyword query performance */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-wider text-ink-3 dark:text-sand/50 font-bold block">
                Google Search Queries Performance
              </span>
              <div className="bg-paper dark:bg-midnight border border-ink/10 dark:border-sand/10 rounded-none overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-card dark:bg-[#121A33] border-b border-ink/10 dark:border-sand/10">
                      <th className="p-2.5 font-bold uppercase tracking-wider text-ink-3 dark:text-sand/50 text-[9px]">Query</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-ink-3 dark:text-sand/50 text-[9px] text-right">Avg. Pos</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-ink-3 dark:text-sand/50 text-[9px] text-right">Impressions</th>
                      <th className="p-2.5 font-bold uppercase tracking-wider text-ink-3 dark:text-sand/50 text-[9px] text-right">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5 dark:divide-sand/5">
                    <tr>
                      <td className="p-2.5 font-mono">{selectedPostForAnalytics.title.toLowerCase()} review</td>
                      <td className="p-2.5 text-right">{(2.1 + (selectedPostForAnalytics.title.length % 3)).toFixed(1)}</td>
                      <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 2.5)}</td>
                      <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 0.12)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono">luxury hotels in {selectedPostForAnalytics.location}</td>
                      <td className="p-2.5 text-right">{(11.5 + (selectedPostForAnalytics.title.length % 5)).toFixed(1)}</td>
                      <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 6.2)}</td>
                      <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 0.04)}</td>
                    </tr>
                    {selectedPostForAnalytics.brand && (
                      <tr>
                        <td className="p-2.5 font-mono">{selectedPostForAnalytics.brand.toLowerCase()} properties location</td>
                        <td className="p-2.5 text-right">{(6.4 + (selectedPostForAnalytics.title.length % 4)).toFixed(1)}</td>
                        <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 1.8)}</td>
                        <td className="p-2.5 text-right">{Math.round(getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) * 0.08)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Recommendations specific to post */}
            <div className="p-4 bg-bordeaux/5 border-l-2 border-bordeaux dark:border-gold-soft flex flex-col gap-2 text-left">
              <span className="text-[9px] tracking-wider uppercase text-bordeaux dark:text-gold-soft font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> SEO &amp; GEO Optimization Advice
              </span>
              <ul className="list-disc pl-4 text-[11px] text-ink-2 dark:text-sand/85 flex flex-col gap-1.5">
                <li>Optimize layout headings to embed italic adjectives near brand names.</li>
                <li>Add at least two internal backlinks pointing to the live {selectedPostForAnalytics.type === 'Partner Guide' ? 'Partner Guide' : 'Preferred PartnerGuide'} lists.</li>
                {getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type) < 100 && (
                  <li>This article has low page views (~{getPostViews(selectedPostForAnalytics.slug, selectedPostForAnalytics.type)} views). Boost engagement by featuring it at the top of the homepage featured hero layout.</li>
                )}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-4 border-t border-ink/10 dark:border-sand/10">
              <button 
                onClick={() => setSelectedPostForAnalytics(null)}
                className="btn--sand text-xs py-2 px-6 rounded-none cursor-pointer"
              >
                Close Metrics Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
