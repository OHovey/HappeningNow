'use client';

import Script from 'next/script';
import { buildBookingLink } from '@/lib/affiliates';
import FtcDisclosure from '@/components/ui/FtcDisclosure';

interface BookingWidgetProps {
  destId: string | null;
  destName: string;
  bestMonth: number;
}

/**
 * Booking.com search box embed with lazy script loading.
 */
export default function BookingWidget({ destId, destName, bestMonth }: BookingWidgetProps) {
  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;

  const fallbackLink = buildBookingLink({
    destinationId: destId,
    city: destName,
    startMonth: bestMonth,
  });

  return (
    <section aria-label="Book accommodation" className="space-y-3">
      <h2 className="text-lg text-text-primary" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
        Find a Place to Stay
      </h2>

      <div
        className="p-5"
        style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {affiliateId ? (
          <>
            <ins
              className="bookingaff"
              data-aid={affiliateId}
              data-target_aid={affiliateId}
              data-prod="nsb"
              data-width="100%"
              {...(destId ? { 'data-dest_id': destId, 'data-dest_type': 'city' } : { 'data-ss': destName })}
            >
              {/* Static fallback visible before script loads */}
              <a
                href={fallbackLink}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
                style={{
                  background: 'var(--cta-booking)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                Search {destName} on Booking.com
              </a>
            </ins>
            <Script
              src="//aff.bstatic.com/static/affiliate_base/js/flexiproduct.js"
              strategy="lazyOnload"
            />
          </>
        ) : (
          <a
            href={fallbackLink}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
            style={{
              background: 'var(--cta-booking)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Search {destName} on Booking.com
          </a>
        )}
      </div>

      <div className="text-center">
        <FtcDisclosure />
      </div>
    </section>
  );
}
