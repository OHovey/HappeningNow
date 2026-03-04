import Image from 'next/image';
import { formatPeakMonths } from '@/lib/structured-data';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

interface WildlifeHeroProps {
  route: MigrationRouteWithGeoJSON;
}

/**
 * Full-width hero image for wildlife detail pages.
 * Shows species name, route name, and peak viewing months.
 * Falls back to a green gradient when no image is available.
 */
export default function WildlifeHero({ route }: WildlifeHeroProps) {
  const peakDisplay = formatPeakMonths(route.peak_months);

  return (
    <div className="grain-overlay relative w-full overflow-hidden" style={{ aspectRatio: '3 / 1', minHeight: 200 }}>
      {route.image_url ? (
        <Image
          src={route.image_url}
          alt={route.species}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${CATEGORY_COLORS.wildlife}DD, #065f46)`,
          }}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Text overlay - bottom left */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl text-white mb-2"
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          {route.species}
        </h1>
        <p
          className="text-lg md:text-xl text-white/85 font-light"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          {route.name}
          {peakDisplay && ` \u00B7 ${peakDisplay}`}
        </p>
      </div>
    </div>
  );
}
