import dynamic from 'next/dynamic';
import { formatPeakMonths } from '@/lib/structured-data';
import { buildGetYourGuideLink } from '@/lib/affiliates';
import FtcDisclosure from '@/components/ui/FtcDisclosure';
import type { MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

const MiniMap = dynamic(() => import('@/components/detail/MiniMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-lg bg-gray-100 animate-pulse"
      style={{ aspectRatio: '16 / 9', maxHeight: 200 }}
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
 * Compute the month-aware active position along the migration route.
 *
 * Maps the current month to a proportional index along the route coordinates.
 * If the current month falls outside the migration window, highlights
 * the nearest endpoint.
 */
function computeActivePosition(
  routeCoordinates: number[][],
  peakMonths: number[],
): [number, number] | undefined {
  if (!routeCoordinates || routeCoordinates.length === 0 || !peakMonths || peakMonths.length === 0) {
    return undefined;
  }

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const firstPeak = peakMonths[0];
  const lastPeak = peakMonths[peakMonths.length - 1];

  // Check if current month falls within migration window
  let monthIndex: number;
  if (firstPeak <= lastPeak) {
    // Normal range (e.g., March to August)
    if (currentMonth < firstPeak) {
      // Before migration - show start
      monthIndex = 0;
    } else if (currentMonth > lastPeak) {
      // After migration - show end
      monthIndex = peakMonths.length - 1;
    } else {
      monthIndex = currentMonth - firstPeak;
    }
  } else {
    // Wrapping range (e.g., November to February)
    const expandedMonths: number[] = [];
    for (let m = firstPeak; m <= 12; m++) expandedMonths.push(m);
    for (let m = 1; m <= lastPeak; m++) expandedMonths.push(m);

    const idx = expandedMonths.indexOf(currentMonth);
    if (idx === -1) {
      // Outside migration window - nearest endpoint
      monthIndex = 0;
    } else {
      monthIndex = idx;
    }
  }

  // Map month index to route coordinate index
  const totalMonths = peakMonths.length > 1 ? peakMonths.length - 1 : 1;
  const fraction = Math.min(monthIndex / totalMonths, 1);
  const coordIndex = Math.round(fraction * (routeCoordinates.length - 1));
  const coord = routeCoordinates[coordIndex];

  return coord ? [coord[0], coord[1]] : undefined;
}

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
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {route.description}
          </p>
        </section>
      )}

      {/* Peak Viewing Months */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Peak Viewing Season
        </h2>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-green-800 font-semibold text-lg">{peakDisplay}</p>
          {route.peak_months && route.peak_months.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {route.peak_months.map((m) => {
                const isCurrentMonth = new Date().getMonth() + 1 === m;
                return (
                  <span
                    key={m}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      isCurrentMonth
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-700'
                    }`}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Migration Route
          </h2>
          <MiniMap
            coordinates={mapCenter}
            routeCoordinates={routeCoordinates}
            activePosition={activePosition}
          />
          <p className="mt-2 text-xs text-gray-500">
            The highlighted dot shows the approximate migration position for the current month.
          </p>
        </section>
      )}

      {/* Affiliate CTAs - wildlife tours */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Experience it live
        </h2>
        <a
          href={gygUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
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
          Find {route.species} tours
        </a>
        <div className="mt-2 flex justify-center">
          <FtcDisclosure />
        </div>
      </section>
    </div>
  );
}
