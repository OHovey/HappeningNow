'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const VIEWPORT_STORAGE_KEY = 'happeningnow_last_viewport';

export interface SavedViewport {
  lng: number;
  lat: number;
  zoom: number;
  month?: number;
  categories?: string;
}

/**
 * Save the current map viewport to localStorage.
 * Called by the map when navigating away to a detail page.
 */
export function saveViewport(viewport: SavedViewport) {
  try {
    localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
  } catch {
    // localStorage unavailable (SSR, private browsing quota)
  }
}

/**
 * Retrieve the saved viewport, if any.
 */
export function getSavedViewport(): SavedViewport | null {
  try {
    const raw = localStorage.getItem(VIEWPORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedViewport) : null;
  } catch {
    return null;
  }
}

interface BackToMapProps {
  /** Fallback coordinates when no saved viewport exists (e.g., destination lat/lng). */
  fallbackLat?: number;
  fallbackLng?: number;
  fallbackZoom?: number;
}

/**
 * Floating "Back to Map" button for detail pages.
 * Navigates to / with saved viewport state as URL search params.
 * Falls back to provided coordinates if no saved viewport exists.
 */
export default function BackToMap({ fallbackLat, fallbackLng, fallbackZoom = 8 }: BackToMapProps = {}) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    const viewport = getSavedViewport();
    if (viewport) {
      const params = new URLSearchParams();
      params.set('lng', String(viewport.lng));
      params.set('lat', String(viewport.lat));
      params.set('zoom', String(viewport.zoom));
      if (viewport.month !== undefined) {
        params.set('month', String(viewport.month));
      }
      if (viewport.categories) {
        params.set('categories', viewport.categories);
      }
      window.location.href = `/?${params.toString()}`;
    } else if (fallbackLat !== undefined && fallbackLng !== undefined) {
      const params = new URLSearchParams();
      params.set('lat', String(fallbackLat));
      params.set('lng', String(fallbackLng));
      params.set('zoom', String(fallbackZoom));
      window.location.href = `/?${params.toString()}`;
    } else {
      router.push('/');
    }
  }, [router, fallbackLat, fallbackLng, fallbackZoom]);

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 text-sm font-semibold text-text-primary transition-all hover:scale-[1.03] active:scale-[0.98]"
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(12px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
      }}
      aria-label="Back to Map"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
      Back to Map
    </button>
  );
}
