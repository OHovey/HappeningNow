import Image from 'next/image';
import Link from 'next/link';
import CrowdBadge from '@/components/ui/CrowdBadge';
import { formatMonthRange } from '@/lib/affiliates';
import type { Event } from '@/lib/supabase/types';

interface NearbyEventsProps {
  events: Event[];
}

/**
 * Grid of nearby/related event cards.
 * Each card links to its event detail page.
 * Returns null if no events provided.
 */
export default function NearbyEvents({ events }: NearbyEventsProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-xl text-text-primary mb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
        Nearby Events
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/event/${event.slug}`}
            className="group flex gap-3 p-3 transition-all hover:scale-[1.01]"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Thumbnail */}
            <div
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden"
              style={{ borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}
            >
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: 'linear-gradient(135deg, var(--surface-sunken) 0%, var(--surface) 100%)' }}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent truncate transition-colors">
                {event.name}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                {formatMonthRange(event.start_month, event.end_month)}
              </p>
              {event.crowd_level && (
                <div className="mt-1">
                  <CrowdBadge level={event.crowd_level} />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
