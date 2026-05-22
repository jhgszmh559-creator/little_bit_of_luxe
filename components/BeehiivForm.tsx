'use client';

import React, { useEffect, useRef } from 'react';

interface BeehiivFormProps {
  className?: string;
}

export default function BeehiivForm({ className }: BeehiivFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any previous script or content to prevent multiple loads
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://subscribe-forms.beehiiv.com/v3/loader.js';
    script.async = true;
    script.setAttribute('data-beehiiv-form', 'b6db6dfe-b4e4-467f-9e5f-1328e085da16');
    
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`beehiiv-form-wrapper w-full ${className || ''}`} 
      style={{ minHeight: '80px' }}
    />
  );
}
