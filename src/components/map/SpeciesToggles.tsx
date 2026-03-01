'use client';

import { getSpeciesColor } from '@/lib/map/migration-layers';

interface SpeciesTogglesProps {
  activeSpecies: string[];
  allSpecies: string[];
  onSpeciesChange: (species: string[]) => void;
}

/**
 * Species filter toggle buttons for migration routes.
 * Color-coded dots per species, styled like CategoryToggles.
 */
export default function SpeciesToggles({
  activeSpecies,
  allSpecies,
  onSpeciesChange,
}: SpeciesTogglesProps) {
  if (allSpecies.length === 0) return null;

  const allActive = activeSpecies.length === allSpecies.length;

  function toggleSpecies(species: string) {
    if (activeSpecies.includes(species)) {
      const next = activeSpecies.filter((s) => s !== species);
      // Keep at least one active
      if (next.length > 0) {
        onSpeciesChange(next);
      }
    } else {
      onSpeciesChange([...activeSpecies, species]);
    }
  }

  function toggleAll() {
    if (allActive) {
      // Deselect all except first
      onSpeciesChange([allSpecies[0]]);
    } else {
      onSpeciesChange([...allSpecies]);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* All button */}
      <button
        onClick={toggleAll}
        className={`
          flex items-center gap-1 rounded-full px-2.5 py-1.5
          min-h-[36px] text-xs font-medium transition-all duration-200
          ${
            allActive
              ? 'bg-white shadow-md text-gray-900'
              : 'bg-white/50 text-gray-400 hover:bg-white/70'
          }
        `}
        aria-label={allActive ? 'Deselect all species' : 'Select all species'}
        aria-pressed={allActive}
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
            className={`
              flex items-center gap-1 rounded-full px-2.5 py-1.5
              min-h-[36px] text-xs font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-white shadow-md text-gray-900'
                  : 'bg-white/50 text-gray-400 hover:bg-white/70'
              }
            `}
            aria-label={`${isActive ? 'Hide' : 'Show'} ${label.toLowerCase()} routes`}
            aria-pressed={isActive}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full transition-opacity duration-200"
              style={{
                backgroundColor: color,
                opacity: isActive ? 1 : 0.4,
              }}
            />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
