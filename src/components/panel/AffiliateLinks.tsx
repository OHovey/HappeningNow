'use client';

import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import type { GeoJSONEventProperties } from '@/lib/supabase/types';

interface AffiliateLinksProps {
  event: GeoJSONEventProperties;
}

/**
 * Prominent CTA buttons for Booking.com and GetYourGuide affiliate links.
 *
 * Uses event data to build contextual deep links with destination IDs,
 * location IDs, and search queries. Handles missing affiliate IDs
 * gracefully by linking to generic search pages.
 */
export default function AffiliateLinks({ event }: AffiliateLinksProps) {
  const bookingUrl = buildBookingLink({
    destinationId: event.booking_destination_id,
    city: event.country ? `${event.name} ${event.country}` : event.name,
    startMonth: event.start_month,
  });

  const gygUrl = buildGetYourGuideLink({
    locationId: event.getyourguide_location_id,
    query: event.country
      ? `${event.name} ${event.country}`
      : event.name,
  });

  const isWildlife = event.category === 'wildlife';

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Booking.com CTA — hidden for wildlife events */}
        {!isWildlife && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Book a stay
          </a>
        )}

        {/* GetYourGuide CTA */}
        <a
          href={gygUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 active:bg-orange-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Find tours
        </a>
      </div>

      <p className="text-center text-xs text-gray-400">
        We may earn a commission from these links
      </p>
    </div>
  );
}
