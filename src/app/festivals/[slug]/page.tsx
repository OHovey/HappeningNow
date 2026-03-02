import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFestivalsByCountry,
  deslugify,
} from '@/lib/supabase/seo-queries';
import { getFestivalCountryIntro } from '@/lib/seo/intro-templates';
import { shouldNoindex } from '@/lib/seo/thin-page-check';
import { getRelatedFestivalLinks } from '@/lib/seo/internal-links';
import SeoPageLayout from '@/components/seo/SeoPageLayout';
import EventCardGrid from '@/components/seo/EventCardGrid';
import FilteredMap from '@/components/seo/FilteredMap';
import type { EventGeoJSON, Event } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// ISR config
// ---------------------------------------------------------------------------

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

// ---------------------------------------------------------------------------
// Known regions — country pages must NOT match these
// ---------------------------------------------------------------------------

const KNOWN_REGIONS = new Set([
  'southeast-asia',
  'europe',
  'africa',
  'south-america',
  'north-america',
  'oceania',
  'middle-east',
  'central-asia',
  'east-asia',
  'south-asia',
  'caribbean',
  'central-america',
]);

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventsToGeoJSON(events: Event[]): EventGeoJSON {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((e) => e.location != null)
      .map((e) => {
        const loc = e.location as { coordinates?: [number, number] } | null;
        const coords: [number, number] = loc?.coordinates ?? [0, 0];

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: coords,
          },
          properties: {
            id: e.id,
            name: e.name,
            slug: e.slug,
            category: e.category,
            description: e.description,
            image_url: e.image_url,
            start_month: e.start_month,
            end_month: e.end_month,
            scale: e.scale,
            crowd_level: e.crowd_level,
            country: e.country,
            region: e.region,
            booking_destination_id: e.booking_destination_id,
            getyourguide_location_id: e.getyourguide_location_id,
          },
        };
      }),
  };
}

function getTopCategories(events: Event[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const name = e.name.toLowerCase();
    for (const keyword of ['music', 'food', 'religious', 'cultural', 'arts', 'dance', 'harvest', 'water', 'fire', 'lantern', 'boat', 'new year']) {
      if (name.includes(keyword)) {
        counts[keyword] = (counts[keyword] ?? 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k);
}

function groupEventsByMonth(events: Event[]): Map<number, Event[]> {
  const grouped = new Map<number, Event[]>();
  for (const event of events) {
    for (let m = event.start_month; m <= event.end_month; m++) {
      const list = grouped.get(m) ?? [];
      list.push(event);
      grouped.set(m, list);
    }
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Regions should not render as country pages
  if (KNOWN_REGIONS.has(slug)) return notFound();

  const countryName = deslugify(slug);
  const events = await getFestivalsByCountry(countryName);

  const noindex = shouldNoindex(events.length);
  const canonical = `https://happeningnow.travel/festivals/${slug}`;

  return {
    title: `Festivals in ${countryName} | HappeningNow`,
    description: `Explore ${events.length} festivals in ${countryName}. Browse by month, see crowd levels, and book accommodation and tours.`,
    alternates: {
      canonical,
    },
    ...(noindex
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function FestivalCountryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Regions should not render as country pages
  if (KNOWN_REGIONS.has(slug)) notFound();

  const countryName = deslugify(slug);
  const events = await getFestivalsByCountry(countryName);
  const topCats = getTopCategories(events);
  const intro = getFestivalCountryIntro(events.length, countryName, topCats);

  const geojson = eventsToGeoJSON(events);
  const eventsByMonth = groupEventsByMonth(events);

  // Related links: link to country+month pages and nearby regions
  const relatedLinks = getRelatedFestivalLinks(countryName, null, null);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Festivals', href: '/festivals' },
    { name: countryName },
  ];

  // Sort months for display
  const sortedMonths = Array.from(eventsByMonth.entries()).sort(
    ([a], [b]) => a - b,
  );

  return (
    <SeoPageLayout
      title={`Festivals in ${countryName}`}
      intro={intro}
      breadcrumbs={breadcrumbs}
      relatedLinks={relatedLinks}
      eventCategory="festivals"
    >
      <section data-section="map">
        <FilteredMap events={geojson} />
      </section>

      {/* Calendar-style grouped by month */}
      {sortedMonths.map(([month, monthEvents]) => (
        <section
          key={month}
          data-section={`month-${month}`}
          className="mt-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {MONTH_NAMES[month]}
          </h2>
          <EventCardGrid events={monthEvents} />
        </section>
      ))}

      {events.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No festivals found for {countryName}.
        </p>
      )}
    </SeoPageLayout>
  );
}
