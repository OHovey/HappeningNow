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
 */
export default function EventCardGrid({ events }: EventCardGridProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-center text-text-tertiary py-8">
        No events found for this selection.
      </p>
    );
  }

  return (
    <section data-section="events">
      <h2 className="text-2xl text-text-primary mb-6" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>Events</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <article
      className="flex flex-col p-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header: name + badges */}
      <div className="mb-3">
        <Link
          href={`/event/${event.slug}`}
          className="text-lg font-semibold text-text-primary hover:text-accent transition-colors"
        >
          <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>{event.name}</h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Category badge */}
          <span
            className="inline-block px-2.5 py-0.5 text-xs font-semibold"
            style={{
              borderRadius: 'var(--radius-full)',
              background: isWildlife ? 'var(--wildlife-surface)' : 'var(--festival-surface)',
              color: isWildlife ? 'var(--wildlife)' : 'var(--festival)',
            }}
          >
            {event.category}
          </span>

          {/* Crowd badge */}
          {event.crowd_level && <CrowdBadge level={event.crowd_level} />}
        </div>
      </div>

      {/* Date and location */}
      <div className="mb-4 space-y-1 text-sm text-text-secondary">
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
              className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--cta-booking)', borderRadius: 'var(--radius-lg)' }}
            >
              Book a stay
            </a>
          )}
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--cta-tours)', borderRadius: 'var(--radius-lg)' }}
          >
            Find tours
          </a>
        </div>

        <p className="text-center text-[11px] text-text-tertiary">
          We may earn a commission from these links
        </p>
      </div>
    </article>
  );
}
