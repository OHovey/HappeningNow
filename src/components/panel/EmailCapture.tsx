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
 * Inline email capture form rendered inside the event detail bottom sheet.
 *
 * Collects email and interest preferences, posts to /api/subscribe,
 * and shows inline success/error feedback without page reload.
 *
 * The eventCategory prop auto-checks the matching interest checkbox
 * so the subscriber is tagged based on the event they are viewing.
 */
export default function EmailCapture({ eventCategory }: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>(() => {
    // Pre-check the interest matching the current event category
    const normalized = eventCategory?.toLowerCase() ?? '';
    const match = INTEREST_OPTIONS.find((opt) => opt.value === normalized);
    return match ? [match.value] : [];
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side validation
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
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }

  // Success state: replace entire form
  if (status === 'success') {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center">
        <p className="font-medium text-green-800">
          You&apos;re subscribed! We&apos;ll alert you about events like this.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">
        Get alerts for events like this
      </h3>

      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={status === 'loading'}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      />

      {/* Interest checkboxes */}
      <div className="flex gap-4">
        {INTEREST_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-1.5 text-sm text-gray-600"
          >
            <input
              type="checkbox"
              checked={interests.includes(opt.value)}
              onChange={() => toggleInterest(opt.value)}
              disabled={status === 'loading'}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {status === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Subscribing...
          </span>
        ) : (
          'Subscribe'
        )}
      </button>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}
    </form>
  );
}
