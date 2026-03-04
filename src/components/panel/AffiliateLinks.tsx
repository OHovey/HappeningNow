'use client';

import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import type { GeoJSONEventProperties } from '@/lib/supabase/types';

interface AffiliateLinksProps {
  event: GeoJSONEventProperties;
}

/**
 * Side-by-side CTA buttons — warm, tactile, clear hierarchy.
 * Book a stay is primary (solid, warm). Find tours is secondary (lighter).
 * Wildlife events show only Find tours as the primary.
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
    <div className="space-y-2">
      <div className={`flex gap-2.5 ${isWildlife ? '' : ''}`}>
        {/* Book a stay — primary for festivals */}
        {!isWildlife && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-1 items-center justify-center gap-2 py-3 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 8px rgba(30, 58, 95, 0.3)',
              letterSpacing: '0.02em',
            }}
          >
            <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Book a stay
          </a>
        )}

        {/* Find tours — secondary for festivals, primary for wildlife */}
        <a
          href={gygUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`flex items-center justify-center gap-2 py-3 text-[13px] font-bold transition-all hover:brightness-110 active:scale-[0.98] ${
            isWildlife ? 'flex-1' : 'flex-1'
          }`}
          style={isWildlife ? {
            background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(180, 83, 9, 0.3)',
            letterSpacing: '0.02em',
          } : {
            background: 'linear-gradient(135deg, rgba(180, 83, 9, 0.08) 0%, rgba(180, 83, 9, 0.04) 100%)',
            color: 'var(--cta-tours)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(180, 83, 9, 0.2)',
          }}
        >
          <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Find tours
        </a>
      </div>

      <p className="text-center text-[10px] tracking-wide text-text-tertiary/60">
        We may earn a commission from these links
      </p>
    </div>
  );
}
