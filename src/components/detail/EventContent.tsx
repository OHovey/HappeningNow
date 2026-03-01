'use client';

import dynamic from 'next/dynamic';
import { formatMonthRange } from '@/lib/affiliates';
import FtcDisclosure from '@/components/ui/FtcDisclosure';
import AffiliateLinks from '@/components/panel/AffiliateLinks';
import type { Event, GeoJSONEventProperties } from '@/lib/supabase/types';

const MiniMap = dynamic(() => import('@/components/detail/MiniMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-lg bg-gray-100 animate-pulse"
      style={{ aspectRatio: '16 / 9', maxHeight: 200 }}
    />
  ),
});

interface EventContentProps {
  event: Event;
  coordinates?: [lng: number, lat: number];
}

/**
 * Event detail content: description, dates, location, mini map, and affiliate CTAs.
 * Rendered below the EventHero in a max-width container.
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Description */}
      {event.description && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </section>
      )}

      {/* Dates and Location */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">When</h3>
          <p className="text-gray-900 font-semibold">{dateRange}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Where</h3>
          <p className="text-gray-900 font-semibold">
            {[event.region, event.country].filter(Boolean).join(', ') || 'Location TBD'}
          </p>
        </div>
      </section>

      {/* Mini Map */}
      {coordinates && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Location</h2>
          <MiniMap coordinates={coordinates} zoom={8} />
        </section>
      )}

      {/* Affiliate CTAs */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
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
