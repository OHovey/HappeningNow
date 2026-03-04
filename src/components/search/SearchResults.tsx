'use client';

import type { SearchEventResult } from '@/lib/supabase/types';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import ResultCard from '@/components/search/ResultCard';

interface SearchResultsProps {
  results: (SearchEventResult & { _score: number })[];
  selectedResultId: string | null;
  onResultSelect: (id: string) => void;
  loading: boolean;
  locationName: string | null;
  radiusKm: number;
  hasLocation: boolean;
}

export default function SearchResults({
  results,
  selectedResultId,
  onResultSelect,
  loading,
  locationName,
  radiusKm,
  hasLocation,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <div
        className="flex h-48 items-center justify-center p-6 text-center"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <p className="text-sm text-text-tertiary">
          Search for events by entering a location above
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div
        className="flex h-48 items-center justify-center p-6 text-center"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <p className="text-sm text-text-tertiary">
          No events found within {radiusKm}km of {locationName ?? 'this location'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto pr-1">
      <p className="text-xs font-medium text-text-tertiary">
        {results.length} event{results.length !== 1 ? 's' : ''} found
      </p>
      {results.map((event) => (
        <ResultCard
          key={event.id}
          event={event}
          isSelected={event.id === selectedResultId}
          onClick={() => onResultSelect(event.id)}
        />
      ))}
    </div>
  );
}
