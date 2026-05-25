'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bookmark, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Sync theme with document class on mount
  useEffect(() => {
    setMounted(true);
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

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('.newsletter');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push('/#newsletter');
    }
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      router.push('/search');
    }
  };

  const navLinks = [
    { href: '/search?category=Hotel+Review', label: 'Reviews' },
    { href: '/search?category=Deals', label: 'Deals' },
    { href: '/search?category=Hotel+News', label: 'News' },
    { href: '/search?category=Guides', label: 'Guides' },
  ];

  return (
    <nav className="nav">
      <div className="container nav__inner">
        {/* Left Column: Navigation links */}
        <div className="nav__links">
          {navLinks.map((link, idx) => {
            const isActive = pathname === '/search' && typeof window !== 'undefined' && 
              new URLSearchParams(window.location.search).get('category') === link.href.split('category=')[1];
            return (
              <Link
                key={idx}
                href={link.href}
                className={`nav__link ${isActive ? 'is-active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Center Column: Logo */}
        <Link href="/" className="nav__logo">
          {mounted ? (
            <img
              src={theme === 'dark' ? '/logos/logo-sand.png' : '/logos/logo-darkblue.png'}
              alt="Little Bit of Luxe"
              className="mix-blend-multiply dark:mix-blend-normal"
              style={{ height: '36px', width: 'auto' }}
            />
          ) : (
            // SSR Fallback (Midnight logo)
            <img
              src="/logos/logo-darkblue.png"
              alt="Little Bit of Luxe"
              className="mix-blend-multiply dark:mix-blend-normal"
              style={{ height: '36px', width: 'auto' }}
            />
          )}
        </Link>

        {/* Right Column: Icons + Theme Toggle + Subscribe */}
        <div className="nav__icons">
          {/* Search Icon */}
          <button
            onClick={handleSearchClick}
            className="icon-btn"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[1.5]" />
          </button>

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="icon-btn"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 stroke-[1.5]" />
              ) : (
                <Moon className="w-5 h-5 stroke-[1.5]" />
              )}
            </button>
          )}

          {/* Bookmark Link */}
          <Link href="/saved" className="icon-btn hidden sm:inline-block" aria-label="Saved Articles">
            <Bookmark className="w-5 h-5 stroke-[1.5]" />
          </Link>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribeClick}
            className="btn-subscribe"
          >
            Subscribe
            <span className="btn-subscribe__arrow">→</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
