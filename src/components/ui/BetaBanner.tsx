'use client';

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'hn-beta-dismissed';

export default function BetaBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed it
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.85)' }}>
        <span className="inline-block mr-2 text-xs px-1.5 py-0.5 rounded-full font-semibold tracking-wide" style={{
          background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
          color: 'white',
          fontSize: '10px',
          letterSpacing: '0.08em',
        }}>
          EARLY ACCESS
        </span>
        You&apos;re seeing HappeningNow before the rest of the world.
        {' '}
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>
          We&apos;re still adding events, polishing features, and making the magic happen.
          Bookmark this page — when you come back, there&apos;ll be even more to explore.
        </span>
      </p>
      <button
        onClick={dismiss}
        className="ml-4 flex-shrink-0 p-1 transition-opacity hover:opacity-100"
        style={{ color: 'rgba(255,255,255,0.4)' }}
        aria-label="Dismiss banner"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
