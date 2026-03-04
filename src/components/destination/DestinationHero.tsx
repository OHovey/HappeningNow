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
      className="grain-overlay relative w-full overflow-hidden"
      style={{
        aspectRatio: '3 / 1',
        minHeight: 180,
        maxHeight: 280,
        background: 'linear-gradient(135deg, #065f46 0%, #0d9488 40%, #14b8a6 100%)',
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl text-white mb-2"
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          {destination.name}
        </h1>
        <p
          className="text-lg md:text-xl text-white/85 font-light"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          {destination.region ? `${destination.region} \u00B7 ` : ''}
          {destination.country}
        </p>
      </div>
    </div>
  );
}
