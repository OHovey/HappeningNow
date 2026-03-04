'use client';

import dynamic from 'next/dynamic';
import { formatPeakMonths } from '@/lib/structured-data';
import { buildGetYourGuideLink } from '@/lib/affiliates';
import { computeActivePosition } from '@/lib/route-utils';
import FtcDisclosure from '@/components/ui/FtcDisclosure';
import type { MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

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

interface WildlifeContentProps {
  route: MigrationRouteWithGeoJSON;
}

const MONTH_NAMES_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Wildlife detail content: description, peak months, migration route map,
 * and affiliate CTAs for wildlife tours.
 */
export default function WildlifeContent({ route }: WildlifeContentProps) {
  const peakDisplay = formatPeakMonths(route.peak_months);
  const routeCoordinates = route.route_geojson?.coordinates ?? [];

  // Compute map center from route midpoint or first coordinate
  const mapCenter: [number, number] = routeCoordinates.length > 0
    ? [
        routeCoordinates[Math.floor(routeCoordinates.length / 2)][0],
        routeCoordinates[Math.floor(routeCoordinates.length / 2)][1],
      ]
    : [0, 20];

  // Compute month-aware active position
  const activePosition = computeActivePosition(routeCoordinates, route.peak_months);

  // Build GYG link for wildlife tours in the species region
  const gygUrl = buildGetYourGuideLink({
    query: `${route.species} wildlife tour`,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Description */}
      {route.description && (
        <section>
          <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>About</h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {route.description}
          </p>
        </section>
      )}

      {/* Peak Viewing Months */}
      <section>
        <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
          Peak Viewing Season
        </h2>
        <div
          className="p-5"
          style={{
            background: 'var(--wildlife-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--wildlife-muted)',
          }}
        >
          <p className="text-lg font-semibold" style={{ color: 'var(--wildlife)' }}>{peakDisplay}</p>
          {route.peak_months && route.peak_months.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {route.peak_months.map((m) => {
                const isCurrentMonth = new Date().getMonth() + 1 === m;
                return (
                  <span
                    key={m}
                    className="inline-flex items-center px-3 py-1 text-sm font-semibold"
                    style={{
                      borderRadius: 'var(--radius-full)',
                      background: isCurrentMonth ? 'var(--wildlife)' : 'rgba(21, 128, 61, 0.1)',
                      color: isCurrentMonth ? 'white' : 'var(--wildlife)',
                    }}
                  >
                    {MONTH_NAMES_SHORT[m]}
                    {isCurrentMonth && ' (now)'}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Migration Route Map */}
      {routeCoordinates.length >= 2 && (
        <section>
          <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
            Migration Route
          </h2>
          <MiniMap
            coordinates={mapCenter}
            routeCoordinates={routeCoordinates}
            activePosition={activePosition}
          />
          <p className="mt-2 text-xs text-text-tertiary">
            The highlighted dot shows the approximate migration position for the current month.
          </p>
        </section>
      )}

      {/* Affiliate CTAs - wildlife tours */}
      <section>
        <h2 className="text-xl text-text-primary mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
          Experience it live
        </h2>
        <a
          href={gygUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: 'var(--wildlife)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Find {route.species} tours
        </a>
        <div className="mt-2 flex justify-center">
          <FtcDisclosure />
        </div>
      </section>
    </div>
  );
}
