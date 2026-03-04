'use client';

import { useState } from 'react';
import { getSpeciesColor } from '@/lib/map/migration-layers';

interface SpeciesTogglesProps {
  activeSpecies: string[];
  allSpecies: string[];
  onSpeciesChange: (species: string[]) => void;
}

/**
 * Species filter toggle buttons for migration routes.
 * Collapsed by default on mobile — expands to show individual species controls.
 * Always expanded on desktop (sm+).
 */
export default function SpeciesToggles({
  activeSpecies,
  allSpecies,
  onSpeciesChange,
}: SpeciesTogglesProps) {
  const [expanded, setExpanded] = useState(false);

  if (allSpecies.length === 0) return null;

  const allActive = activeSpecies.length === allSpecies.length;
  const activeCount = activeSpecies.length;

  function toggleSpecies(species: string) {
    if (activeSpecies.includes(species)) {
      const next = activeSpecies.filter((s) => s !== species);
      if (next.length > 0) {
        onSpeciesChange(next);
      }
    } else {
      onSpeciesChange([...activeSpecies, species]);
    }
  }

  function toggleAll() {
    if (allActive) {
      onSpeciesChange([allSpecies[0]]);
    } else {
      onSpeciesChange([...allSpecies]);
    }
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Mobile: collapsed toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="map-control flex items-center gap-2 px-3 py-2 min-h-[40px] text-xs font-semibold transition-all duration-200 sm:hidden"
        aria-expanded={expanded}
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Stacked species dots preview */}
        <span className="flex -space-x-1">
          {allSpecies.slice(0, 4).map((s) => (
            <span
              key={s}
              className="inline-block h-2 w-2 rounded-full ring-1 ring-white/80"
              style={{
                backgroundColor: getSpeciesColor(s),
                opacity: activeSpecies.includes(s) ? 1 : 0.3,
              }}
            />
          ))}
        </span>
        <span>Routes</span>
        <span className="text-text-tertiary">({activeCount})</span>
        <svg
          className="h-3 w-3 text-text-tertiary transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mobile: expanded species list (dropdown panel) */}
      {expanded && (
        <div
          className="mt-1 p-2 sm:hidden"
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(12px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {/* All toggle */}
          <button
            onClick={toggleAll}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors"
            style={{
              color: allActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: allActive ? 'var(--accent)' : 'var(--border)' }} />
            All species
          </button>

          {allSpecies.map((species) => {
            const isActive = activeSpecies.includes(species);
            const color = getSpeciesColor(species);
            const label = species.charAt(0).toUpperCase() + species.slice(1);

            return (
              <button
                key={species}
                onClick={() => toggleSpecies(species)}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: color,
                    opacity: isActive ? 1 : 0.25,
                    boxShadow: isActive ? `0 0 4px ${color}50` : 'none',
                  }}
                />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop: always-visible inline toggles (hidden on mobile) */}
      <div className="hidden sm:flex sm:flex-wrap sm:gap-1">
        <button
          onClick={toggleAll}
          className="map-control flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold transition-all duration-200"
          aria-label={allActive ? 'Deselect all species' : 'Select all species'}
          aria-pressed={allActive}
          style={{ color: allActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
        >
          All
        </button>

        {allSpecies.map((species) => {
          const isActive = activeSpecies.includes(species);
          const color = getSpeciesColor(species);
          const label = species.charAt(0).toUpperCase() + species.slice(1);

          return (
            <button
              key={species}
              onClick={() => toggleSpecies(species)}
              className="map-control flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-semibold transition-all duration-200"
              aria-label={`${isActive ? 'Hide' : 'Show'} ${label.toLowerCase()} routes`}
              aria-pressed={isActive}
              style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: color,
                  opacity: isActive ? 1 : 0.3,
                  boxShadow: isActive ? `0 0 4px ${color}50` : 'none',
                }}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
