import type { DestinationWithCoords } from '@/lib/supabase/types';

interface DestinationHeroProps {
  destination: DestinationWithCoords;
}

/**
 * Destination hero section with name, country/region, and gradient background.
 * Server component (no 'use client').
 */
export default function DestinationHero({ destination }: DestinationHeroProps) {
  return (
    <div
      className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-500"
      style={{ aspectRatio: '3 / 1', minHeight: 180, maxHeight: 280 }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          {destination.name}
        </h1>
        <p
          className="text-lg md:text-xl text-white/90"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {destination.region ? `${destination.region} \u00B7 ` : ''}
          {destination.country}
        </p>
      </div>
    </div>
  );
}
