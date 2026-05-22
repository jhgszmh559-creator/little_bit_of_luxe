'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Heading {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first heading that is intersecting
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -65% 0px',
        threshold: 0,
      }
    );

    headingElements.forEach(el => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="toc" aria-label="Table of Contents">
      <div className="toc__header">
        <h4 className="lbl-eyebrow text-bordeaux">In This Article</h4>
      </div>
      <nav className="toc__nav">
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            className={`toc__link ${activeId === h.id ? 'toc__link--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(h.id);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveId(h.id);
              }
            }}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
