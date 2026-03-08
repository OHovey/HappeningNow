'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { getSpeciesColor } from '@/lib/map/migration-layers';

interface MapFilterBarProps {
  activeCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  activeSpecies: string[];
  allSpecies: string[];
  onSpeciesChange: (species: string[]) => void;
}

type DropdownType = 'layers' | null;

export default function MapFilterBar({
  activeCategories,
  onCategoryChange,
  activeSpecies,
  allSpecies,
  onSpeciesChange,
}: MapFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;

    function onMouseDown(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openDropdown]);

  // Category toggle
  const toggleCategory = useCallback(
    (category: string) => {
      if (activeCategories.includes(category)) {
        const next = activeCategories.filter((c) => c !== category);
        if (next.length > 0) onCategoryChange(next);
      } else {
        onCategoryChange([...activeCategories, category]);
      }
    },
    [activeCategories, onCategoryChange],
  );

  // Species toggle
  const toggleSpecies = useCallback(
    (species: string) => {
      if (activeSpecies.includes(species)) {
        const next = activeSpecies.filter((s) => s !== species);
        if (next.length > 0) onSpeciesChange(next);
      } else {
        onSpeciesChange([...activeSpecies, species]);
      }
    },
    [activeSpecies, onSpeciesChange],
  );

  const toggleAllSpecies = useCallback(() => {
    const allActive = activeSpecies.length === allSpecies.length;
    if (allActive) {
      onSpeciesChange([allSpecies[0]]);
    } else {
      onSpeciesChange([...allSpecies]);
    }
  }, [activeSpecies, allSpecies, onSpeciesChange]);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={barRef}
        className="pointer-events-auto relative glass-panel flex h-12 items-center gap-0"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        {/* 1. Search link */}
        <Link
          href="/search"
          className="flex items-center gap-2 px-3.5 h-full min-w-[44px] text-xs font-semibold shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px shrink-0" style={{ background: 'var(--border-subtle)' }} />

        {/* 2. Category toggles (inline) */}
        <div className="flex items-center gap-1 px-1.5 overflow-x-auto scrollbar-none">
          {ALL_CATEGORIES.map((key) => {
            const isActive = activeCategories.includes(key);
            const color = CATEGORY_COLORS[key];
            const label = CATEGORY_LABELS[key];

            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className="flex items-center gap-1.5 px-2.5 h-8 min-w-[44px] text-xs font-medium transition-all duration-200 rounded-full"
                aria-label={`${isActive ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                aria-pressed={isActive}
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  background: isActive ? 'var(--surface-elevated)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full transition-all duration-200 shrink-0"
                  style={{
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.3,
                    boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
                  }}
                />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-6 w-px shrink-0" style={{ background: 'var(--border-subtle)' }} />

        {/* 4. Layers dropdown trigger */}
        <div className="relative ml-auto">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'layers' ? null : 'layers')}
            className="flex items-center gap-1.5 px-3.5 h-12 min-w-[44px] text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              color: openDropdown === 'layers' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
            }}
            aria-expanded={openDropdown === 'layers'}
            aria-label="Toggle map layers"
          >
            {/* Layers icon */}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="hidden sm:inline">Layers</span>
            <svg
              className="h-3 w-3 text-text-tertiary transition-transform duration-200"
              style={{ transform: openDropdown === 'layers' ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Layers dropdown */}
          {openDropdown === 'layers' && (
            <div
              className="absolute right-0 top-full mt-2 p-2"
              style={{
                background: 'var(--glass)',
                backdropFilter: 'blur(12px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                width: '220px',
              }}
            >
              {/* Species section */}
              {allSpecies.length > 0 && (
                <>
                  {/* Divider */}
                  <div className="my-1.5 mx-2" style={{ height: '1px', background: 'var(--border-subtle)' }} />

                  <div className="px-2 pt-1 pb-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Migration Routes
                    </span>
                  </div>

                  {/* All toggle */}
                  <button
                    onClick={toggleAllSpecies}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      color: activeSpecies.length === allSpecies.length ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}
                    aria-pressed={activeSpecies.length === allSpecies.length}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        background: activeSpecies.length === allSpecies.length ? 'var(--accent)' : 'var(--border)',
                      }}
                    />
                    <span>All species</span>
                  </button>

                  {/* Per-species rows */}
                  {allSpecies.map((species) => {
                    const isActive = activeSpecies.includes(species);
                    const color = getSpeciesColor(species);
                    const label = species.charAt(0).toUpperCase() + species.slice(1);

                    return (
                      <button
                        key={species}
                        onClick={() => toggleSpecies(species)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                        aria-pressed={isActive}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0 transition-all duration-200"
                          style={{
                            backgroundColor: color,
                            opacity: isActive ? 1 : 0.25,
                            boxShadow: isActive ? `0 0 4px ${color}50` : 'none',
                          }}
                        />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
