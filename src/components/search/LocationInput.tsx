'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { SelectedLocation } from '@/components/search/SearchPage';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    state?: string;
    country?: string;
    city?: string;
  };
}

interface LocationInputProps {
  initialValue: string;
  onSelect: (loc: SelectedLocation) => void;
}

function formatFeatureName(props: PhotonFeature['properties']): string {
  const parts = [props.name ?? props.city, props.state, props.country].filter(Boolean);
  return parts.join(', ');
}

export default function LocationInput({ initialValue, onSelect }: LocationInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialValue when it changes externally
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Geocode failed');
      const data = await res.json();
      const features: PhotonFeature[] = data.features ?? [];
      setSuggestions(features);
      setIsOpen(features.length > 0);
      setHighlightIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    },
    [fetchSuggestions],
  );

  const selectSuggestion = useCallback(
    (feature: PhotonFeature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const name = formatFeatureName(feature.properties);
      setQuery(name);
      setIsOpen(false);
      setSuggestions([]);
      onSelect({ lat, lng, name });
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [isOpen, suggestions, highlightIndex, selectSuggestion],
  );

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (suggestions.length > 0) setIsOpen(true);
  }, [suggestions]);

  return (
    <div className="relative">
      <div className="relative">
        {/* Location pin icon */}
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          ref={inputRef}
          id="location-input"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="Where are you going?"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="location-suggestions"
          aria-activedescendant={highlightIndex >= 0 ? `suggestion-${highlightIndex}` : undefined}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <ul
          id="location-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {loading && (
            <li className="px-4 py-2 text-sm text-gray-400">Searching...</li>
          )}
          {!loading && suggestions.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-400">No results</li>
          )}
          {suggestions.map((feature, i) => (
            <li
              key={`${feature.geometry.coordinates[0]}-${feature.geometry.coordinates[1]}-${i}`}
              id={`suggestion-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={`cursor-pointer px-4 py-2 text-sm ${
                i === highlightIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                selectSuggestion(feature);
              }}
            >
              {formatFeatureName(feature.properties)}
            </li>
          ))}
        </ul>
      )}

      {/* Loading state below input */}
      {loading && !isOpen && query.length >= 2 && (
        <p className="mt-1 text-xs text-gray-400">Searching...</p>
      )}
    </div>
  );
}
