'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { worthTheTripScore } from '@/lib/scoring';
import type { SearchEventResult } from '@/lib/supabase/types';
import SearchBar from '@/components/search/SearchBar';
import SearchResults from '@/components/search/SearchResults';
import AlertSignup from '@/components/search/AlertSignup';
import dynamic from 'next/dynamic';

const SearchMap = dynamic(() => import('@/components/search/SearchMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: 'var(--surface-sunken)' }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary/20 border-t-text-secondary" />
        <p className="text-xs font-medium text-text-tertiary">Loading map</p>
      </div>
    </div>
  ),
});

export interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const name = searchParams.get('name');
    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng), name: name ?? '' };
    }
    return null;
  });
  const [startMonth, setStartMonth] = useState<number | null>(() => {
    const v = searchParams.get('from');
    return v ? parseInt(v, 10) : null;
  });
  const [endMonth, setEndMonth] = useState<number | null>(() => {
    const v = searchParams.get('to');
    return v ? parseInt(v, 10) : null;
  });
  const [category, setCategory] = useState<string | null>(() => searchParams.get('cat'));
  const [radius, setRadius] = useState<number>(() => {
    const v = searchParams.get('radius');
    return v ? parseInt(v, 10) : 200000;
  });
  const [results, setResults] = useState<(SearchEventResult & { _score: number })[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync filters to URL params
  const syncUrlParams = useCallback(
    (loc: SelectedLocation | null, sm: number | null, em: number | null, cat_: string | null, rad: number) => {
      const params = new URLSearchParams();
      if (loc) {
        params.set('lat', loc.lat.toFixed(4));
        params.set('lng', loc.lng.toFixed(4));
        params.set('name', loc.name);
      }
      if (sm) params.set('from', String(sm));
      if (em) params.set('to', String(em));
      if (cat_) params.set('cat', cat_);
      if (rad !== 200000) params.set('radius', String(rad));
      router.replace(`/search?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // Auto-search effect: debounced fetch when filters change
  useEffect(() => {
    if (!selectedLocation) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          lat: String(selectedLocation.lat),
          lng: String(selectedLocation.lng),
          radius: String(radius),
        });
        if (startMonth) params.set('start_month', String(startMonth));
        if (endMonth) params.set('end_month', String(endMonth));
        if (category) params.set('category', category);

        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error('Search failed');
        const data: SearchEventResult[] = await res.json();

        // Score and sort client-side
        const scored = data
          .map((e) => ({ ...e, _score: worthTheTripScore(e) }))
          .sort((a, b) => b._score - a._score);
        setResults(scored);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [selectedLocation, startMonth, endMonth, category, radius]);

  // Sync URL when filters change
  useEffect(() => {
    syncUrlParams(selectedLocation, startMonth, endMonth, category, radius);
  }, [selectedLocation, startMonth, endMonth, category, radius, syncUrlParams]);

  const handleLocationSelect = useCallback((loc: SelectedLocation) => {
    setSelectedLocation(loc);
    setSelectedResultId(null);
  }, []);

  const handleResultSelect = useCallback((id: string) => {
    setSelectedResultId((prev) => (prev === id ? null : id));
  }, []);

  const handleMarkerClick = useCallback((eventId: string) => {
    setSelectedResultId((prev) => (prev === eventId ? null : eventId));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Search bar */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <SearchBar
          locationName={selectedLocation?.name ?? ''}
          onLocationSelect={handleLocationSelect}
          startMonth={startMonth}
          onStartMonthChange={setStartMonth}
          endMonth={endMonth}
          onEndMonthChange={setEndMonth}
          category={category}
          onCategoryChange={setCategory}
          radius={radius}
          onRadiusChange={setRadius}
        />
      </div>

      {/* Results + Map layout */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Results list */}
          <div className="w-full lg:w-1/2">
            <SearchResults
              results={results}
              selectedResultId={selectedResultId}
              onResultSelect={handleResultSelect}
              loading={loading}
              locationName={selectedLocation?.name ?? null}
              radiusKm={Math.round(radius / 1000)}
              hasLocation={!!selectedLocation}
            />
            {selectedLocation && (
              <AlertSignup
                locationName={selectedLocation.name}
                region={selectedLocation.name}
              />
            )}
          </div>

          {/* Map */}
          <div className="hidden h-[calc(100vh-220px)] sticky top-4 lg:block lg:w-1/2">
            <div
              className="h-full overflow-hidden"
              style={{
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <SearchMap
                results={results}
                selectedResultId={selectedResultId}
                onMarkerClick={handleMarkerClick}
                userLocation={selectedLocation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
