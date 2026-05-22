'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Share2, Mail, Link2, Check } from 'lucide-react';

// Branded icons (not available in lucide-react)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z"/>
    </svg>
  );
}

interface ShareMenuProps {
  url: string;
  title: string;
  excerpt?: string;
}

// X/Twitter icon (not in lucide)
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function ShareMenu({ url, title, excerpt = '' }: ShareMenuProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ title, text: excerpt, url });
    } catch (e) {
      // User cancelled or error
    }
  }, [title, excerpt, url]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedExcerpt = encodeURIComponent(excerpt);

  return (
    <div className="share-menu">
      {canNativeShare && (
        <button onClick={handleNativeShare} className="share-menu__btn" aria-label="Share" title="Share">
          <Share2 className="w-4 h-4" />
        </button>
      )}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-menu__btn"
        aria-label="Share on Facebook"
        title="Facebook"
      >
        <FacebookIcon className="w-4 h-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-menu__btn"
        aria-label="Share on X"
        title="X / Twitter"
      >
        <XIcon className="w-4 h-4" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="share-menu__btn"
        aria-label="Share on LinkedIn"
        title="LinkedIn"
      >
        <LinkedinIcon className="w-4 h-4" />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`}
        className="share-menu__btn"
        aria-label="Share via Email"
        title="Email"
      >
        <Mail className="w-4 h-4" />
      </a>
      <button onClick={handleCopyLink} className="share-menu__btn share-menu__btn--copy" aria-label="Copy link" title="Copy Link">
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
        {copied && <span className="share-menu__tooltip">Copied!</span>}
      </button>
    </div>
  );
}
