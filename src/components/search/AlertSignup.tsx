'use client';

import { useState, FormEvent } from 'react';

const ALERT_CATEGORIES = ['Festivals', 'Wildlife', 'Markets', 'Other'] as const;

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface AlertSignupProps {
  locationName: string;
  region: string;
}

export default function AlertSignup({ locationName, region }: AlertSignupProps) {
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(ALERT_CATEGORIES.map((c) => c.toLowerCase())),
  );
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!locationName) return null;

  const toggleCategory = (cat: string) => {
    setCategories((prev) => {
      const next = new Set(prev);
      const key = cat.toLowerCase();
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setFormState('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          region,
          categories: Array.from(categories),
          alert: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Subscription failed');
      }

      setFormState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-800">
          You&apos;ll get alerts for events near {locationName}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        Get alerts for events near {locationName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Category checkboxes */}
        <div className="flex flex-wrap gap-3">
          {ALERT_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={categories.has(cat.toLowerCase())}
                onChange={() => toggleCategory(cat)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {cat}
            </label>
          ))}
        </div>

        {/* Email + submit */}
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={formState === 'loading'}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {formState === 'loading' ? 'Saving...' : 'Alert me'}
          </button>
        </div>

        {formState === 'error' && (
          <p className="text-xs text-red-600">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
