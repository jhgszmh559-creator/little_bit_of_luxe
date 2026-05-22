'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkNow = document.documentElement.classList.contains('dark');
          setTheme(isDarkNow ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer" style={{ marginTop: '0px' }}>
      <div className="container footer__inner">
        {/* Brand Block */}
        <div className="footer__brand">
          {mounted ? (
            <img
              src={theme === 'dark' ? '/logos/logo-darkblue.png' : '/logos/logo-sand.png'}
              alt="Little Bit of Luxe"
              style={{ height: '48px', width: 'auto', marginBottom: '16px' }}
            />
          ) : (
            <img
              src="/logos/logo-sand.png"
              alt="Little Bit of Luxe"
              style={{ height: '48px', width: 'auto', marginBottom: '16px' }}
            />
          )}
          <p className="footer__tag">
            A travel journal for the kind of places worth going slowly.
          </p>
        </div>

        {/* Column 1: Sections */}
        <div className="footer__col">
          <h5>Sections</h5>
          <ul>
            <li>
              <Link href="/search?category=Hotel+Review">
                Hotel Reviews
              </Link>
            </li>
            <li>
              <Link href="/search?category=Preferred+Partner">
                Preferred Partners
              </Link>
            </li>
            <li>
              <Link href="/search?category=Dispatch">
                Dispatches
              </Link>
            </li>
            <li>
              <Link href="/search?category=Guides">
                Guides
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Destinations */}
        <div className="footer__col">
          <h5>Destinations</h5>
          <ul>
            <li>
              <Link href="/search?q=Italy">
                Italy
              </Link>
            </li>
            <li>
              <Link href="/search?q=France">
                France
              </Link>
            </li>
            <li>
              <Link href="/search?q=Japan">
                Japan
              </Link>
            </li>
            <li>
              <Link href="/search?q=Americas">
                The Americas
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Editorial */}
        <div className="footer__col">
          <h5>Editorial</h5>
          <ul>
            <li>
              <Link href="#">
                About
              </Link>
            </li>
            <li>
              <Link href="#">
                How we review
              </Link>
            </li>
            <li>
              <Link href="#">
                Press
              </Link>
            </li>
            <li>
              <Link href="#">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="container footer__bottom">
        <span>© {currentYear} Little Bit of Luxe</span>
        <span>
          <a href="/admin" className="hover:text-white transition-colors uppercase font-semibold" style={{ marginRight: '16px', letterSpacing: '0.18em' }}>
            ADMIN
          </a>
        </span>
      </div>
    </footer>
  );
}
