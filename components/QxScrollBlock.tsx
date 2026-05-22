'use client';

import React, { useEffect, useState } from 'react';

interface QxScrollBlockProps {
  programName: string;
  partnerLink: string;
}

export default function QxScrollBlock({ programName, partnerLink }: QxScrollBlockProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`qx-portal-banner ${visible ? '' : 'is-hidden'}`}>
      <div className="qx-portal-banner__content">
        <span className="lbl-eyebrow text-sand/60 text-[10px] block" style={{ letterSpacing: '0.15em' }}>
          Direct Booking Access
        </span>
        <p>
          Book via Little Bit of Luxe to instantly access <strong>{programName}</strong> rates with our direct QX Portal.
        </p>
      </div>
      <a
        href={partnerLink || "https://www.qxtravel.io/special-programs/preferred-partner"}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-subscribe"
      >
        Book Now <span className="btn-subscribe__arrow">→</span>
      </a>
    </div>
  );
}
