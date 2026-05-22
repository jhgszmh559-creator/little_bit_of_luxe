'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, FileText, Settings, BookOpen, Sun, Moon } from 'lucide-react';

interface EditorFormProps {
  type: 'review' | 'program' | 'news';
  slug: string;
  initialData: any;
}

export default function EditorForm({ type, slug: initialSlug, initialData }: EditorFormProps) {
  const router = useRouter();
  
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
  const [title, setTitle] = useState(initialData?.title || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || (type === 'program' ? 'Preferred Partner' : type === 'news' ? 'Hotel News' : 'Hotel Review'));
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
  const [ogImage, setOgImage] = useState(initialData?.image || initialData?.ogImage || '');

  // News specific fields
  const [propertyName, setPropertyName] = useState(initialData?.propertyName || '');
  const [projectedOpening, setProjectedOpening] = useState(initialData?.projectedOpening || '');
  const [earlyNewsletterCta, setEarlyNewsletterCta] = useState(initialData?.earlyNewsletterCta !== false);
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editorTab, setEditorTab] = useState<'content' | 'metadata'>('content');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      alert('Please provide a unique URL slug.');
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      type,
      slug,
      title,
      excerpt,
      content,
      category,
      draft,
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
        router.refresh();
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
    const text = type === 'program' ? programName : type === 'news' ? propertyName : hotelName;
    if (text) {
      const slugified = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(slugified);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-ink transition-colors">
      
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
          <span className="text-xs uppercase tracking-widest font-semibold">
            {initialSlug ? `Edit ${type}` : `New ${type}`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 border border-ink/15 hover:border-ink/30 text-ink rounded-[3px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Theme toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn--sand text-xs py-2 px-5 flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>
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

      {/* Editor Workspace Container */}
      <main className="flex-grow max-w-[1280px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Segmented Editor Tabs */}
        <div className="flex bg-card border border-ink/10 p-1 rounded-[3px] shadow-sm max-w-[480px] mx-auto w-full">
          <button
            onClick={() => setEditorTab('content')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 min-h-[44px] ${
              editorTab === 'content' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3 hover:text-ink bg-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Editorial Body
          </button>
          <button
            onClick={() => setEditorTab('metadata')}
            className={`flex-1 py-3 text-xs uppercase font-bold tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 min-h-[44px] ${
              editorTab === 'metadata' ? 'bg-midnight text-sand dark:bg-sand dark:text-midnight' : 'text-ink-3 hover:text-ink bg-transparent'
            }`}
          >
            <Settings className="w-4 h-4" /> Metadata Dossier
          </button>
        </div>

        {/* Editor Form Body */}
        <form onSubmit={handleSave} className="flex-grow flex flex-col gap-6 bg-card border border-ink/10 p-6 md:p-8 shadow-sm rounded-[2px]">
          
          {editorTab === 'content' ? (
            /* Tab 1: Editorial Title & Body Content */
            <div className="flex-grow flex flex-col gap-6">
              
              {/* Creative Title */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Creative Headline (Italicize one *word* signature)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. A weekend at the Splendido that lived up to its *name*."
                  className="w-full text-lg md:text-2xl font-serif bg-transparent border border-ink/15 p-4 outline-none focus:border-ink text-ink rounded-[2px] min-h-[52px]"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Poetic Serif Dek / Excerpt */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Poetic Serif Dek / Excerpt
                </label>
                <textarea 
                  rows={2}
                  placeholder="One elegant, poetic, serif italic sentence setting the scene."
                  className="w-full text-sm font-serif italic bg-transparent border border-ink/15 p-4 outline-none focus:border-ink text-ink rounded-[2px] resize-none"
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  required
                />
              </div>

              {/* Markdown Body Content */}
              <div className="flex-grow flex flex-col gap-2 min-h-[300px]">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Journal Markdown Body
                </label>
                <textarea 
                  placeholder="Write the full luxury travel prose article. HTML tags like <div class='verdict-box'> or <div class='my-12 p-8 bg-midnight text-sand'> are automatically supported."
                  className="w-full flex-grow text-base font-serif bg-transparent border border-ink/15 p-4 outline-none focus:border-ink text-ink rounded-[2px] min-h-[300px] resize-y"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>

            </div>
          ) : (
            /* Tab 2: Core Metadata Dossier */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Type Switcher info */}
              <div className="md:col-span-2 p-4 bg-paper border border-ink/5 text-xs text-ink-2">
                You are editing a <strong>{type === 'program' ? 'Preferred Partner Guide' : type === 'news' ? 'Hotel News Opening' : 'Hotel Inspection Review'}</strong>.
              </div>

              {/* URL Slug */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex justify-between items-center">
                  <span>URL Slug (Unique identifier)</span>
                  <button 
                    type="button" 
                    onClick={autoGenerateSlug}
                    className="text-[9px] uppercase tracking-wider text-bordeaux dark:text-gold-soft hover:underline min-h-[32px] px-2 flex items-center"
                  >
                    Auto-Generate
                  </button>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. virtuoso"
                  className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  disabled={!!initialSlug}
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Journal Category
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Hotel Review, Hotel News, Preferred Partner"
                  className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Publish Date
                </label>
                <input 
                  type="date"
                  className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Draft Status */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Publishing Status
                </label>
                <select 
                  className="w-full text-sm bg-card border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={draft ? 'true' : 'false'}
                  onChange={e => setDraft(e.target.value === 'true')}
                >
                  <option value="true">Save as Draft (Private)</option>
                  <option value="false">Publish (Public to Journal)</option>
                </select>
              </div>

              {/* Conditionally render fields based on Content Type */}
              {type === 'review' && (
                /* REVIEW FIELDS */
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Hotel Property Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Belmond Hotel Caruso"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={hotelName}
                      onChange={e => setHotelName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Hotel Brand Network
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Belmond, Rosewood, Aman"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Location / Region
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Ravello, Italy"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Inspection Rating Score (1.0 to 10.0)
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Room Type Tested
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Junior Suite Superior"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={roomType}
                      onChange={e => setRoomType(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      YouTube Video ID (Optional preview embed)
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. dQw4w9WgXcQ"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={youtubeId}
                      onChange={e => setYoutubeId(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 justify-center pt-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-[2px] border-ink text-ink bg-transparent focus:ring-0 cursor-pointer"
                        checked={showQxPerks}
                        onChange={e => setShowQxPerks(e.target.checked)}
                      />
                      <span>Inject QX Perks Booking Banner</span>
                    </label>
                  </div>
                </>
              )}

              {type === 'program' && (
                /* PROGRAM FIELDS */
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Program Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Rosewood Elite"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={programName}
                      onChange={e => setProgramName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Loyalty Network Core
                    </label>
                    <select 
                      className="w-full text-sm bg-card border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={loyaltyNetwork}
                      onChange={e => setLoyaltyNetwork(e.target.value)}
                    >
                      <option value="Hilton">Hilton</option>
                      <option value="Marriott">Marriott</option>
                      <option value="Hyatt">Hyatt</option>
                      <option value="Accor">Accor</option>
                      <option value="IHG">IHG</option>
                      <option value="Independent">Independent</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Participating Brands (Comma separated list)
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Waldorf Astoria, LXR, Conrad"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={brands}
                      onChange={e => setBrands(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Official Website Link
                    </label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={officialLink}
                      onChange={e => setOfficialLink(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Partner Booking CTA Link
                    </label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={partnerLink}
                      onChange={e => setPartnerLink(e.target.value)}
                    />
                  </div>
                </>
              )}

              {type === 'news' && (
                /* NEWS FIELDS */
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Property Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. The Emory"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={propertyName}
                      onChange={e => setPropertyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Brand
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Maybourne Hotel Group"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Location
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Belgravia, London"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Projected Opening Time
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Opened Spring 2024"
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={projectedOpening}
                      onChange={e => setProjectedOpening(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                      Original Citation Link
                    </label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                      value={sourceUrl}
                      onChange={e => setSourceUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 justify-center pt-2">
                    <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold flex items-center gap-2 cursor-pointer min-h-[44px]">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-[2px] border-ink text-ink bg-transparent focus:ring-0 cursor-pointer"
                        checked={earlyNewsletterCta}
                        onChange={e => setEarlyNewsletterCta(e.target.checked)}
                      />
                      <span>Inject Early Newsletter CTA</span>
                    </label>
                  </div>
                </>
              )}

              {/* Cover/OG Image URL */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[10px] tracking-wider uppercase text-ink-3 font-semibold">
                  Cover / OG Image URL (High-res Unsplash placeholder)
                </label>
                <input 
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-sm bg-transparent border border-ink/15 px-4 py-3 outline-none focus:border-ink text-ink rounded-[2px] min-h-[44px]"
                  value={ogImage}
                  onChange={e => setOgImage(e.target.value)}
                />
              </div>

            </div>
          )}

        </form>

      </main>
    </div>
  );
}
