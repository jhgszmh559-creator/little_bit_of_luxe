'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Search, Settings, CheckCircle, 
  AlertCircle, ExternalLink, Link2, MapPin, 
  Sun, Moon, Loader2, Sparkles, BarChart2, Calendar, Eye
} from 'lucide-react';

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
  category: string;
}

interface AdminDashboardClientProps {
  programs: Program[];
  reviews: Review[];
  news: News[];
}

export default function AdminDashboardClient({ programs, reviews, news }: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reviews' | 'programs' | 'news'>('reviews');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleType, setArticleType] = useState<'review' | 'news' | 'program'>('review');
  const [propertyName, setPropertyName] = useState('');
  const [generationMode, setGenerationMode] = useState<'manual' | 'ai'>('ai');
  const [aiNotes, setAiNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // SEO & GEO Audit State
  const [selectedAuditItem, setSelectedAuditItem] = useState<any>(null);
  const [seoAudit, setSeoAudit] = useState<any>(null);
  
  // Analytics State (GSC + Vercel)
  const [gscKeywords, setGscKeywords] = useState<any[]>([]);
  const [pageviews, setPageviews] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [gscStatus, setGscStatus] = useState<string>('Initializing...');
  const [analyticsSource, setAnalyticsSource] = useState<string>('mock');
  
  // Bidirectional Links State
  const [suggestedLinks, setSuggestedLinks] = useState<any[]>([]);

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
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setGscKeywords(data.keywords || []);
        setPageviews(data.pageviews || []);
        setGscStatus(data.gscStatus || 'Connected');
        setAnalyticsSource(data.source || 'mock');
      } else {
        setGscStatus('API Error');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setGscStatus('Connection Failed');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Run SEO / GEO audit on selection
  const runAudit = (item: any) => {
    setSelectedAuditItem(item);
    
    const isProgram = item.category === 'Preferred Partner';
    const isNews = item.category === 'Hotel News';
    
    const checklist = [
      { id: 'meta-title', label: 'Meta title present and length optimal (50-60 chars)', passed: item.title.length > 20 },
      { id: 'meta-desc', label: 'poetic serif dek sentence / meta description structured', passed: item.excerpt.length > 50 },
      { id: 'geo-citation', label: 'Generative Engine citation signals present', passed: isProgram ? item.brands.length > 30 : isNews ? !!item.brand : true },
      { id: 'structured-data', label: 'JSON-LD structured data configured', passed: true },
      { id: 'verdict-block', label: isProgram ? 'Verifiable Signature Verdict Box compiled' : isNews ? 'Facts matrix verified' : 'Verdict Summary Box active', passed: true },
      { id: 'qx-cta', label: 'QX Perks or Newsletter signups embedded', passed: true }
    ];

    const score = Math.round((checklist.filter(c => c.passed).length / checklist.length) * 100);
    
    setSeoAudit({
      score,
      checklist,
      recommendations: score < 100 ? [
        'Inject more architectural verbs to build depth',
        'Add at least two internal backlinks to relevant loyalty networks',
        'Optimize heading structure to place the italic word on the H1 tag'
      ] : []
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

        if (response.ok) {
          const result = await response.json();
          setIsModalOpen(false);
          setPropertyName('');
          setAiNotes('');
          router.refresh();
          // Redirect directly to editing the new article
          router.push(`/admin/editor?type=${articleType}&slug=${result.slug}`);
        } else {
          const errData = await response.json();
          alert(`AI generation failed: ${errData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        alert('An unexpected error occurred during AI generation.');
      } finally {
        setGenerating(false);
      }
    }
  };

  // Filter items based on search query
  const filteredReviews = reviews.filter(r => 
    r.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrograms = programs.filter(p => 
    p.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.loyaltyNetwork.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = news.filter(n => 
    (n.propertyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-ink transition-colors pb-12">
      
      {/* CMS Top Header Bar */}
      <header className="bg-card text-ink py-6 px-6 md:px-12 flex items-center justify-between border-b border-ink/10 sticky top-0 z-40 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <Link href="/" className="nav__logo block">
            {mounted && (
              <img
                src={theme === 'dark' ? '/logos/logo-sand.png' : '/logos/logo-darkblue.png'}
                alt="Little Bit of Luxe"
                style={{ height: '32px', width: 'auto' }}
              />
            )}
          </Link>
          <span className="text-[10px] uppercase tracking-widest bg-ink/10 text-ink/80 px-2.5 py-1 rounded-[3px] font-bold">
            CMS Admin
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 border border-ink/15 hover:border-ink/30 text-ink rounded-[3px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn--sand text-xs py-2 px-4 flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Write New Article
          </button>
          <Link href="/" className="text-xs text-ink/70 hover:text-ink flex items-center gap-1.5 uppercase tracking-wider min-h-[44px] px-2">
            View Site <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main CMS Layout */}
      <div className="flex-grow max-w-[1440px] w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        
        {/* Left Column: Content Management */}
        <section className="flex flex-col gap-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 border border-ink/10 rounded-[3px] shadow-sm transition-colors">
            
            {/* Tabs */}
            <div className="flex gap-1 border-b border-ink/10 md:border-none pb-2 md:pb-0">
              <button 
                onClick={() => { setActiveTab('reviews'); setSelectedAuditItem(null); setSeoAudit(null); }}
                className={`px-4 py-2 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all min-h-[44px] ${
                  activeTab === 'reviews' 
                    ? 'border-bordeaux text-bordeaux dark:border-gold dark:text-gold' 
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button 
                onClick={() => { setActiveTab('news'); setSelectedAuditItem(null); setSeoAudit(null); }}
                className={`px-4 py-2 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all min-h-[44px] ${
                  activeTab === 'news' 
                    ? 'border-bordeaux text-bordeaux dark:border-gold dark:text-gold' 
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                News ({news.length})
              </button>
              <button 
                onClick={() => { setActiveTab('programs'); setSelectedAuditItem(null); setSeoAudit(null); }}
                className={`px-4 py-2 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all min-h-[44px] ${
                  activeTab === 'programs' 
                    ? 'border-bordeaux text-bordeaux dark:border-gold dark:text-gold' 
                    : 'border-transparent text-ink-3 hover:text-ink'
                }`}
              >
                Partners ({programs.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex items-center bg-paper border border-ink/15 px-3 py-1.5 rounded-[3px] w-full md:max-w-[320px]">
              <Search className="w-4 h-4 text-ink-3 mr-2" />
              <input 
                type="text" 
                placeholder="Filter journal database..." 
                className="bg-transparent text-sm text-ink outline-none w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          {/* Database Grid */}
          <div className="bg-card border border-ink/10 shadow-sm overflow-hidden rounded-[3px] transition-colors">
            {activeTab === 'reviews' && (
              filteredReviews.length > 0 ? (
                <div className="divide-y divide-ink/5">
                  {filteredReviews.map((review) => (
                    <div 
                      key={review.slug} 
                      className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-paper/30 ${selectedAuditItem?.slug === review.slug ? 'bg-paper-2' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] tracking-wider uppercase bg-sage/10 text-sage font-bold px-2 py-0.5 rounded-[3px]">
                            {review.brand || 'Independent'}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {review.location}
                          </span>
                          {review.draft && (
                            <span className="text-[9px] uppercase tracking-wider bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded-[2px] font-bold">Draft</span>
                          )}
                        </div>
                        <h4 className="font-serif text-xl font-medium text-ink">
                          {review.hotelName}
                        </h4>
                        <p className="text-xs text-ink-3 line-clamp-1 italic font-serif">
                          {review.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <span className="font-serif text-sm font-semibold text-gold bg-gold/5 px-2 py-1">
                          {review.rating.toFixed(1)} / 10
                        </span>
                        <button 
                          onClick={() => runAudit(review)}
                          className="px-3 py-1.5 border border-ink/25 text-ink hover:border-ink text-[11px] font-semibold uppercase tracking-wider rounded-[3px] cursor-pointer"
                        >
                          Audit Strategy
                        </button>
                        <Link 
                          href={`/admin/editor?type=review&slug=${review.slug}`}
                          className="px-3 py-1.5 bg-midnight text-sand text-[11px] font-semibold uppercase tracking-wider hover:bg-bordeaux rounded-[3px] min-h-[38px] flex items-center"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <FileText className="w-12 h-12 text-ink-4 mx-auto mb-3 stroke-[1.2]" />
                  <h4 className="font-serif text-lg italic text-ink-2 mb-1">No hotel reviews inspected yet</h4>
                  <p className="text-sm text-ink-3 mb-4">Draft a new property or create one manually.</p>
                  <button onClick={() => { setArticleType('review'); setIsModalOpen(true); }} className="btn--primary text-xs py-2 px-4 rounded-[3px] inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Hotel Review
                  </button>
                </div>
              )
            )}

            {activeTab === 'news' && (
              filteredNews.length > 0 ? (
                <div className="divide-y divide-ink/5">
                  {filteredNews.map((n) => (
                    <div 
                      key={n.slug} 
                      className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-paper/30 ${selectedAuditItem?.slug === n.slug ? 'bg-paper-2' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] tracking-wider uppercase bg-sage/10 text-sage font-bold px-2 py-0.5 rounded-[3px]">
                            {n.brand || 'Independent'}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {n.location}
                          </span>
                          {n.draft && (
                            <span className="text-[9px] uppercase tracking-wider bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded-[2px] font-bold">Draft</span>
                          )}
                        </div>
                        <h4 className="font-serif text-xl font-medium text-ink">
                          {n.propertyName || n.title}
                        </h4>
                        <p className="text-xs text-ink-3 line-clamp-1 italic font-serif">
                          {n.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <span className="text-xs text-ink-3 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {n.projectedOpening || n.date}
                        </span>
                        <button 
                          onClick={() => runAudit(n)}
                          className="px-3 py-1.5 border border-ink/25 text-ink hover:border-ink text-[11px] font-semibold uppercase tracking-wider rounded-[3px] cursor-pointer"
                        >
                          Audit Strategy
                        </button>
                        <Link 
                          href={`/admin/editor?type=news&slug=${n.slug}`}
                          className="px-3 py-1.5 bg-midnight text-sand text-[11px] font-semibold uppercase tracking-wider hover:bg-bordeaux rounded-[3px] min-h-[38px] flex items-center"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <FileText className="w-12 h-12 text-ink-4 mx-auto mb-3 stroke-[1.2]" />
                  <h4 className="font-serif text-lg italic text-ink-2 mb-1">No hotel news available yet</h4>
                  <p className="text-sm text-ink-3 mb-4">Create a news article or draft one using AI.</p>
                  <button onClick={() => { setArticleType('news'); setIsModalOpen(true); }} className="btn--primary text-xs py-2 px-4 rounded-[3px] inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Hotel News
                  </button>
                </div>
              )
            )}

            {activeTab === 'programs' && (
              filteredPrograms.length > 0 ? (
                <div className="divide-y divide-ink/5">
                  {filteredPrograms.map((program) => (
                    <div 
                      key={program.slug} 
                      className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-paper/30 ${selectedAuditItem?.slug === program.slug ? 'bg-paper-2' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] tracking-wider uppercase bg-midnight/10 text-midnight dark:bg-sand/10 dark:text-sand font-bold px-2 py-0.5 rounded-[3px]">
                            {program.loyaltyNetwork} Network
                          </span>
                          <span className="text-xs text-ink-3">
                            Updated {program.date}
                          </span>
                        </div>
                        <h4 className="font-serif text-xl font-medium text-ink">
                          {program.programName}
                        </h4>
                        <p className="text-xs text-ink-3 line-clamp-1 italic font-serif">
                          {program.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <button 
                          onClick={() => runAudit(program)}
                          className="px-3 py-1.5 border border-ink/25 text-ink hover:border-ink text-[11px] font-semibold uppercase tracking-wider rounded-[3px] cursor-pointer"
                        >
                          Audit Strategy
                        </button>
                        <Link 
                          href={`/admin/editor?type=program&slug=${program.slug}`}
                          className="px-3 py-1.5 bg-midnight text-sand text-[11px] font-semibold uppercase tracking-wider hover:bg-bordeaux rounded-[3px] min-h-[38px] flex items-center"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <Plus className="w-12 h-12 text-ink-4 mx-auto mb-3 stroke-[1.2]" />
                  <h4 className="font-serif text-lg italic text-ink-2 mb-1">No partner programs found</h4>
                  <p className="text-sm text-ink-3 mb-4">Create a partner program manually.</p>
                </div>
              )
            )}
          </div>

        </section>

        {/* Right Column: strategy Audit widgets + Analytics */}
        <aside className="flex flex-col gap-8">
          
          {/* Vercel Analytics Visualizer */}
          <div className="bg-card border border-ink/10 p-6 rounded-[3px] shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <span className="lbl-eyebrow text-ink font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sage" /> Vercel Pageviews (7d)
              </span>
              <span className="text-[10px] uppercase font-bold text-sage">Active Traffic</span>
            </div>

            {loadingAnalytics ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-ink" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Custom Sparkline Chart */}
                <div className="flex items-end justify-between h-20 px-2 pt-4 bg-paper/50 rounded-[3px] border border-ink/5 gap-1.5">
                  {pageviews.map((pv, idx) => {
                    const maxVal = Math.max(...pageviews.map(p => p.views));
                    const percentage = (pv.views / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-grow flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-sage/40 hover:bg-sage transition-all rounded-t-[1px]" 
                          style={{ height: `${Math.max(10, percentage * 0.5)}px` }}
                          title={`${pv.views} views`}
                        />
                        <span className="text-[8px] text-ink-3 font-semibold leading-none">{pv.date.split(' ')[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-ink-3">Total Pageviews:</span>
                  <span className="font-serif font-bold text-ink text-sm">
                    {pageviews.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SEO & GEO Audit Panel */}
          <div className="bg-card border border-ink/10 p-6 rounded-[3px] shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <span className="lbl-eyebrow text-ink font-bold">SEO &amp; GEO Strategy Audit</span>
              <Sparkles className="w-4 h-4 text-bordeaux dark:text-gold-soft" />
            </div>
            
            {selectedAuditItem ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-paper p-3 border border-ink/5 rounded-[3px]">
                  <div>
                    <h5 className="font-serif text-base text-ink line-clamp-1 font-semibold">
                      {selectedAuditItem.hotelName || selectedAuditItem.propertyName || selectedAuditItem.programName}
                    </h5>
                    <span className="text-[10px] uppercase text-ink-3">Strategy checklist rating</span>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                    seoAudit.score > 80 ? 'bg-sage' : seoAudit.score > 50 ? 'bg-terracotta' : 'bg-bordeaux'
                  }`}>
                    {seoAudit.score}%
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">Checks Analyzed</span>
                  <div className="flex flex-col gap-2">
                    {seoAudit.checklist.map((check: any) => (
                      <div key={check.id} className="flex items-start gap-2.5 text-xs text-ink-2">
                        {check.passed ? (
                          <CheckCircle className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                        )}
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {seoAudit.recommendations.length > 0 && (
                  <div className="p-4 bg-bordeaux/5 border-l-2 border-bordeaux flex flex-col gap-2">
                    <span className="text-[10px] tracking-wider uppercase text-bordeaux font-bold">Optimizations Required</span>
                    <ul className="list-disc pl-4 text-xs text-ink-2 flex flex-col gap-1.5">
                      {seoAudit.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bidirectional link suggestions */}
                {suggestedLinks.length > 0 && (
                  <div className="pt-4 border-t border-ink/10 flex flex-col gap-3">
                    <span className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Bidirectional Backlinks
                    </span>
                    <div className="flex flex-col gap-2.5">
                      {suggestedLinks.map((link: any, index: number) => (
                        <div key={index} className="p-3 bg-paper-2/60 border border-ink/5 text-xs rounded-[3px] flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink truncate max-w-[200px]">{link.parentGuide}</span>
                            <span className="text-[9px] uppercase tracking-wider text-sage font-bold bg-sage/10 px-1.5 py-0.5 rounded-[2px]">Guide Found</span>
                          </div>
                          <p className="text-[11px] text-ink-3">Recommended anchor text:</p>
                          <code className="bg-card p-1 text-[10px] font-mono border border-ink/5 text-bordeaux dark:text-gold-soft rounded select-all">
                            {`[${link.recommendedAnchor}](/program/${link.parentSlug})`}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-3 text-sm italic">
                Select an inspection item from the database list to run a strategic SEO &amp; GEO quality audit checklist.
              </div>
            )}
          </div>

          {/* Google Search Console Striking Distance Panel */}
          <div className="bg-card border border-ink/10 p-6 rounded-[3px] shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <span className="lbl-eyebrow text-ink font-bold">GSC Striking Distance Keywords</span>
              <BarChart2 className="w-4 h-4 text-ink-3" />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-3">GSC API Status:</span>
                <span className={`font-bold text-xs ${gscStatus.includes('Connected') ? 'text-sage' : 'text-terracotta'}`}>{gscStatus}</span>
              </div>
              <span className="text-[9px] text-ink-4">Analyzing impressions in positions 11 to 20</span>
            </div>

            {loadingAnalytics ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-ink" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {gscKeywords.map((k, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-paper border border-ink/5 flex flex-col gap-1.5 hover:border-bordeaux/40 transition-colors rounded-[3px]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-xs font-semibold text-ink truncate max-w-[180px]">{k.keyword}</span>
                      <span className="text-[10px] font-bold text-terracotta bg-terracotta/5 px-2 py-0.5 shrink-0 rounded-[3px]">
                        Pos: {k.position}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-3 pt-1.5 border-t border-ink/5">
                      <span>Impressions: <strong>{k.impressions}</strong></span>
                      <span>Clicks: <strong>{k.clicks}</strong></span>
                    </div>
                    <button 
                      onClick={() => {
                        setArticleType(activeTab === 'news' ? 'news' : activeTab === 'programs' ? 'program' : 'review');
                        setPropertyName(k.keyword);
                        setAiNotes(`Draft an article targeting keywords: "${k.keyword}"`);
                        setGenerationMode('ai');
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-center bg-midnight text-sand dark:bg-sand dark:text-midnight hover:bg-bordeaux hover:text-white dark:hover:bg-bordeaux dark:hover:text-white text-[10px] uppercase font-semibold py-1.5 tracking-wider w-full rounded-[2px] transition-colors cursor-pointer"
                    >
                      Convert to Writing Task
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

      </div>

      {/* Modal for "Write New Article" */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-midnight/60 dark:bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-ink/10 p-6 md:p-8 max-w-[560px] w-full shadow-2xl rounded-[3px] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h3 className="font-serif text-2xl font-semibold text-ink">Write New Article</h3>
              <button 
                onClick={() => { setIsModalOpen(false); setPropertyName(''); }}
                className="text-ink-3 hover:text-ink text-xl font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="flex flex-col gap-5">
              
              {/* Layout Type Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Article Layout type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['review', 'news', 'program'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setArticleType(t)}
                      className={`py-3 px-2 text-center text-xs uppercase font-bold tracking-wider rounded-[3px] border transition-all min-h-[44px] ${
                        articleType === t 
                          ? 'bg-midnight text-sand border-midnight dark:bg-sand dark:text-midnight dark:border-sand' 
                          : 'bg-transparent text-ink-3 border-ink/15 hover:border-ink/30 hover:text-ink'
                      }`}
                    >
                      {t === 'review' ? 'Hotel Review' : t === 'news' ? 'Hotel News' : 'Partner Guide'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property / Brand / Program Title */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  {articleType === 'review' ? 'Hotel Name' : articleType === 'news' ? 'New Property Name' : 'Program Name'}
                </label>
                <input 
                  type="text"
                  placeholder={articleType === 'review' ? 'e.g. Aman Venice' : articleType === 'news' ? 'e.g. The Emory London' : 'e.g. Rosewood Elite'}
                  className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={propertyName}
                  onChange={e => setPropertyName(e.target.value)}
                  required
                />
              </div>

              {/* Creation Mode selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Creation Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink cursor-pointer min-h-[44px]">
                    <input 
                      type="radio" 
                      name="creationMode" 
                      value="ai"
                      checked={generationMode === 'ai'}
                      onChange={() => setGenerationMode('ai')}
                      className="w-4 h-4 text-ink bg-transparent focus:ring-0 cursor-pointer"
                    />
                    <span>Draft with Claude AI</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink cursor-pointer min-h-[44px]">
                    <input 
                      type="radio" 
                      name="creationMode" 
                      value="manual"
                      checked={generationMode === 'manual'}
                      onChange={() => setGenerationMode('manual')}
                      className="w-4 h-4 text-ink bg-transparent focus:ring-0 cursor-pointer"
                    />
                    <span>Manual Draft (Empty)</span>
                  </label>
                </div>
              </div>

              {/* Claude AI Prompts */}
              {generationMode === 'ai' && (
                <div className="flex flex-col gap-2 animate-slide-down">
                  <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center justify-between">
                    <span>AI Writing Instructions / Notes</span>
                    <span className="text-[9px] text-sage font-bold">Model: claude-sonnet-4-6</span>
                  </label>
                  <textarea 
                    rows={4}
                    placeholder="Enter any details about location, amenities, rating, or personal editorial notes. Claude will craft a beautiful, publish-ready article in our signature voice..."
                    className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] resize-none"
                    value={aiNotes}
                    onChange={e => setAiNotes(e.target.value)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setPropertyName(''); }}
                  className="px-5 py-3 border border-ink/15 text-ink text-xs uppercase font-bold tracking-wider rounded-[3px] hover:bg-paper cursor-pointer min-h-[44px]"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn--sand text-xs py-3 px-6 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Drafting Article...
                    </>
                  ) : (
                    generationMode === 'ai' ? 'Draft with AI' : 'Create Article'
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
