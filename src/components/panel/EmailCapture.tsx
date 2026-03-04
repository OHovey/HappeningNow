'use client';

import { useState, FormEvent } from 'react';

interface EmailCaptureProps {
  eventCategory: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INTEREST_OPTIONS = [
  { value: 'festivals', label: 'Festivals' },
  { value: 'wildlife', label: 'Wildlife' },
];

/**
 * Compact email capture — contained card aesthetic.
 * Sits inside its own surface zone in the panel.
 */
export default function EmailCapture({ eventCategory }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>(() => {
    const normalized = eventCategory?.toLowerCase() ?? '';
    const match = INTEREST_OPTIONS.find((opt) => opt.value === normalized);
    return match ? [match.value] : [];
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !EMAIL_REGEX.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, interests, eventCategory }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json();
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--wildlife)' }}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">You&apos;re in! We&apos;ll send you alerts.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 flex-shrink-0 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <h3 className="text-[13px] font-semibold text-text-primary">
          Get alerts for events like this
        </h3>
      </div>

      {/* Email + submit in one row */}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className="min-w-0 flex-1 px-3 py-2 text-[13px] text-text-primary placeholder-text-tertiary/50 disabled:opacity-50"
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex-shrink-0 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
          style={{
            background: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            letterSpacing: '0.02em',
          }}
        >
          {status === 'loading' ? '...' : 'Notify me'}
        </button>
      </div>

      {/* Interest pills */}
      <div className="flex gap-2">
        {INTEREST_OPTIONS.map((opt) => {
          const isActive = interests.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleInterest(opt.value)}
              disabled={status === 'loading'}
              className="px-3 py-1 text-[11px] font-semibold tracking-wide transition-all"
              style={{
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--text-primary)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                border: isActive ? 'none' : '1px solid var(--border)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {status === 'error' && errorMessage && (
        <p className="text-[11px]" style={{ color: 'var(--festival)' }}>{errorMessage}</p>
      )}
    </form>
  );
}
