import Image from 'next/image';
import CrowdBadge from '@/components/ui/CrowdBadge';
import { formatMonthRange } from '@/lib/affiliates';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { Event } from '@/lib/supabase/types';

interface EventHeroProps {
  event: Event;
}

/**
 * Full-width hero image with overlaid event name, dates, and crowd badge.
 * Falls back to a gradient background when no image is available.
 */
export default function EventHero({ event }: EventHeroProps) {
  const dateRange = formatMonthRange(event.start_month, event.end_month);
  const gradientColor =
    event.category === 'festival'
      ? CATEGORY_COLORS.festival
      : CATEGORY_COLORS.wildlife;

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3 / 1', minHeight: 200 }}>
      {event.image_url ? (
        <Image
          src={event.image_url}
          alt={event.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${gradientColor}CC, ${gradientColor}66)`,
          }}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Crowd badge - top right */}
      {event.crowd_level && (
        <div className="absolute top-4 right-4 z-10">
          <CrowdBadge level={event.crowd_level} />
        </div>
      )}

      {/* Text overlay - bottom left */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
        <h1
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          {event.name}
        </h1>
        <p
          className="text-lg md:text-xl text-white/90"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {dateRange}
          {event.country && ` \u00B7 ${event.region ?? event.country}`}
        </p>
      </div>
    </div>
  );
}
