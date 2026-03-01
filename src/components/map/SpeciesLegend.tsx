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
    <div className="rounded-lg bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Migration Routes
      </p>
      <div className="flex flex-col gap-0.5">
        {species.map((s) => {
          const color = getSpeciesColor(s);
          const label = s.charAt(0).toUpperCase() + s.slice(1);

          return (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] text-gray-600">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
