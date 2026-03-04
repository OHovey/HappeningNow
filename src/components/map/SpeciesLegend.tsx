'use client';

import { getSpeciesColor } from '@/lib/map/migration-layers';

interface SpeciesLegendProps {
  species: string[];
}

/**
 * Compact color-coded species legend for migration routes.
 * Positioned in a corner showing color dot + species name for each visible species.
 */
export default function SpeciesLegend({ species }: SpeciesLegendProps) {
  if (species.length === 0) return null;

  return (
    <div className="glass-panel px-3 py-2.5" style={{ borderRadius: 'var(--radius-md)' }}>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
        Migration Routes
      </p>
      <div className="flex flex-col gap-1">
        {species.map((s) => {
          const color = getSpeciesColor(s);
          const label = s.charAt(0).toUpperCase() + s.slice(1);

          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] font-medium text-text-secondary">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
