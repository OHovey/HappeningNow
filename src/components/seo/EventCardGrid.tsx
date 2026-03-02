import Link from 'next/link';
import { buildBookingLink, buildGetYourGuideLink, formatMonthRange } from '@/lib/affiliates';
import CrowdBadge from '@/components/ui/CrowdBadge';
import type { Event } from '@/lib/supabase/types';

interface EventCardGridProps {
  events: Event[];
  showPricing?: boolean;
}

/**
 * Grid of event cards with prominent affiliate CTAs.
 *
 * Renders a responsive grid (1/2/3 cols) of event cards. Each card includes:
 * - Event name (h3), date range, location, category badge, crowd badge
 * - Bold "Book a stay" CTA (Booking.com) - hidden for wildlife events
 * - Bold "Find tours" CTA (GetYourGuide)
 * - Link to event detail page
 * - FTC disclosure
 *
 * Uses article elements for event cards per AIDX-03.
 */
export default function EventCardGrid({ events }: EventCardGridProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No events found for this selection.
      </p>
    );
  }

  return (
    <section data-section="events">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Events</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function EventCard({ event }: { event: Event }) {
  const isWildlife = event.category === 'wildlife';

  const bookingUrl = buildBookingLink({
    destinationId: event.booking_destination_id,
    city: event.country ? `${event.name} ${event.country}` : event.name,
    startMonth: event.start_month,
  });

  const gygUrl = buildGetYourGuideLink({
    locationId: event.getyourguide_location_id,
    query: event.country ? `${event.name} ${event.country}` : event.name,
  });

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: name + badges */}
      <div className="mb-3">
        <Link
          href={`/event/${event.slug}`}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
        >
          <h3>{event.name}</h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Category badge */}
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isWildlife
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {event.category}
          </span>

          {/* Crowd badge */}
          {event.crowd_level && <CrowdBadge level={event.crowd_level} />}
        </div>
      </div>

      {/* Date and location */}
      <div className="mb-4 space-y-1 text-sm text-gray-600">
        <p>{formatMonthRange(event.start_month, event.end_month)}</p>
        {(event.country || event.region) && (
          <p>
            {[event.country, event.region].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Affiliate CTAs */}
      <div className="mt-auto space-y-2">
        <div className="flex gap-2">
          {!isWildlife && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Book a stay
            </a>
          )}
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Find tours
          </a>
        </div>

        <p className="text-center text-xs text-gray-400">
          We may earn a commission from these links
        </p>
      </div>
    </article>
  );
}
