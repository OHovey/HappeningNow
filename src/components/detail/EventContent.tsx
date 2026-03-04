'use client';

import dynamic from 'next/dynamic';
import { formatMonthRange } from '@/lib/affiliates';
import { computeActivePosition } from '@/lib/route-utils';
import FtcDisclosure from '@/components/ui/FtcDisclosure';
import AffiliateLinks from '@/components/panel/AffiliateLinks';
import type { EventWithCoords, GeoJSONEventProperties } from '@/lib/supabase/types';

const MiniMap = dynamic(() => import('@/components/detail/MiniMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full animate-pulse"
      style={{
        aspectRatio: '16 / 9',
        maxHeight: 200,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  ),
});

interface EventContentProps {
  event: EventWithCoords;
  coordinates?: [lng: number, lat: number];
}

/**
 * Event detail content: description, dates, location, mini map, and affiliate CTAs.
 */
export default function EventContent({ event, coordinates }: EventContentProps) {
  const dateRange = formatMonthRange(event.start_month, event.end_month);

  // Build GeoJSON-like properties for AffiliateLinks compatibility
  const eventProps: GeoJSONEventProperties = {
    id: event.id,
    name: event.name,
    slug: event.slug,
    category: event.category,
    description: event.description,
    image_url: event.image_url,
    start_month: event.start_month,
    end_month: event.end_month,
    scale: event.scale,
    crowd_level: event.crowd_level,
    country: event.country,
    region: event.region,
    booking_destination_id: event.booking_destination_id,
    getyourguide_location_id: event.getyourguide_location_id,
  };

  // Extract route data for wildlife events with a linked migration route
  const routeCoordinates = event.route_geojson?.coordinates;
  const hasRoute = routeCoordinates && routeCoordinates.length >= 2;

  // Compute active position and map center when route data is available
  const activePosition = hasRoute && event.peak_months
    ? computeActivePosition(routeCoordinates, event.peak_months)
    : undefined;

  const mapCenter: [number, number] | undefined = hasRoute
    ? [
        routeCoordinates[Math.floor(routeCoordinates.length / 2)][0],
        routeCoordinates[Math.floor(routeCoordinates.length / 2)][1],
      ]
    : coordinates;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Description */}
      {event.description && (
        <section>
          <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>About</h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </section>
      )}

      {/* Dates and Location — inline on mobile, cards on desktop */}
      <section>
        {/* Mobile: compact inline row */}
        <div
          className="flex items-center gap-3 p-3 sm:hidden"
          style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}
        >
          <div className="flex items-center gap-1.5 text-sm">
            <svg className="h-3.5 w-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-text-primary">{dateRange}</span>
          </div>
          <span className="text-text-tertiary">·</span>
          <div className="flex items-center gap-1.5 text-sm">
            <svg className="h-3.5 w-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold text-text-primary">
              {[event.region, event.country].filter(Boolean).join(', ') || 'Location TBD'}
            </span>
          </div>
        </div>

        {/* Desktop: separate cards */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3">
          <div className="p-4" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1.5">When</h3>
            <p className="text-text-primary font-semibold">{dateRange}</p>
          </div>
          <div className="p-4" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1.5">Where</h3>
            <p className="text-text-primary font-semibold">
              {[event.region, event.country].filter(Boolean).join(', ') || 'Location TBD'}
            </p>
          </div>
        </div>
      </section>

      {/* Mini Map */}
      {mapCenter && (
        <section>
          <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            {hasRoute ? 'Migration Route' : 'Location'}
          </h2>
          <MiniMap
            coordinates={mapCenter}
            zoom={8}
            routeCoordinates={hasRoute ? routeCoordinates : undefined}
            activePosition={activePosition}
          />
          {hasRoute && (
            <p className="mt-2 text-xs text-text-tertiary">
              The highlighted dot shows the approximate migration position for the current month.
            </p>
          )}
        </section>
      )}

      {/* Affiliate CTAs */}
      <section>
        <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
          Plan your trip
        </h2>
        <AffiliateLinks event={eventProps} />
        <div className="mt-2 flex justify-center">
          <FtcDisclosure />
        </div>
      </section>
    </div>
  );
}
