import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getFestivalsByRegionMonth,
  getFestivalsByCountryMonth,
  deslugify,
} from '@/lib/supabase/seo-queries';
import {
  getFestivalRegionMonthIntro,
  getFestivalCountryMonthIntro,
} from '@/lib/seo/intro-templates';
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
// Known regions for slug disambiguation
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

function isKnownRegion(slug: string): boolean {
  return KNOWN_REGIONS.has(slug);
}

function parseMonth(monthParam: string): number | null {
  const n = parseInt(monthParam, 10);
  if (isNaN(n) || n < 1 || n > 12) return null;
  return n;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventsToGeoJSON(events: Event[]): EventGeoJSON {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((e) => e.location != null)
      .map((e) => {
        // Extract coordinates from location - stored as WKB or GeoJSON
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
    // Extract rough category from event names
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

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; month: string }>;
}): Promise<Metadata> {
  const { slug, month: monthParam } = await params;
  const month = parseMonth(monthParam);
  if (!month) return notFound();

  const monthName = MONTH_NAMES[month];
  const isRegion = isKnownRegion(slug);

  let events: Event[];
  let title: string;
  let description: string;

  if (isRegion) {
    const regionName = deslugify(slug);
    events = await getFestivalsByRegionMonth(regionName, month);
    title = `Festivals in ${regionName} in ${monthName} | HappeningNow`;
    description = `Discover ${events.length} festivals happening in ${regionName} during ${monthName}. Browse dates, crowd levels, and book accommodation.`;
  } else {
    const countryName = deslugify(slug);
    events = await getFestivalsByCountryMonth(countryName, month);
    title = `Festivals in ${countryName} in ${monthName} | HappeningNow`;
    description = `Find ${events.length} festivals in ${countryName} during ${monthName}. See dates, locations, crowd levels, and booking links.`;
  }

  const noindex = shouldNoindex(events.length);
  const canonical = `https://happeningnow.travel/festivals/${slug}/${month}`;

  return {
    title,
    description,
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

export default async function FestivalSlugMonthPage({
  params,
}: {
  params: Promise<{ slug: string; month: string }>;
}) {
  const { slug, month: monthParam } = await params;
  const month = parseMonth(monthParam);
  if (!month) notFound();

  const monthName = MONTH_NAMES[month!];
  const isRegion = isKnownRegion(slug);

  let events: Event[];
  let title: string;
  let intro: string;
  let breadcrumbLabel: string;
  let relatedLinks: Array<{ href: string; label: string }>;

  if (isRegion) {
    const regionName = deslugify(slug);
    events = await getFestivalsByRegionMonth(regionName, month!);
    title = `Festivals in ${regionName} in ${monthName}`;
    intro = getFestivalRegionMonthIntro(events.length, regionName, monthName);
    breadcrumbLabel = regionName;

    relatedLinks = getRelatedFestivalLinks(null, regionName, month!);
  } else {
    const countryName = deslugify(slug);
    events = await getFestivalsByCountryMonth(countryName, month!);
    title = `Festivals in ${countryName} in ${monthName}`;
    const topCats = getTopCategories(events);
    intro = getFestivalCountryMonthIntro(events.length, countryName, monthName, topCats);
    breadcrumbLabel = countryName;

    relatedLinks = getRelatedFestivalLinks(countryName, null, month!);
  }

  const geojson = eventsToGeoJSON(events);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Festivals', href: '/festivals' },
    { name: breadcrumbLabel, href: `/festivals/${slug}` },
    { name: monthName },
  ];

  return (
    <SeoPageLayout
      title={title}
      intro={intro}
      breadcrumbs={breadcrumbs}
      relatedLinks={relatedLinks}
      eventCategory="festivals"
    >
      <section data-section="map">
        <FilteredMap events={geojson} />
      </section>

      <section data-section="events" className="mt-8">
        <EventCardGrid events={events} />
      </section>
    </SeoPageLayout>
  );
}
