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
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Nearby Events
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/event/${event.slug}`}
            className="group flex gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
          >
            {/* Thumbnail */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
              {event.image_url ? (
                <Image
                  src={event.image_url}
                  alt={event.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                {event.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
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
