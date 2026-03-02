import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWildlifeByRegion, deslugify } from '@/lib/supabase/seo-queries';
import { getWildlifeRegionIntro } from '@/lib/seo/intro-templates';
import { shouldNoindex } from '@/lib/seo/thin-page-check';
import { getRelatedWildlifeLinks } from '@/lib/seo/internal-links';
import SeoPageLayout from '@/components/seo/SeoPageLayout';
import EventCardGrid from '@/components/seo/EventCardGrid';
import FilteredMap from '@/components/seo/FilteredMap';
import type { EventGeoJSON } from '@/lib/supabase/types';

export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

function eventsToGeoJSON(events: Array<{ id: string; name: string; slug: string; category: string; lng?: number; lat?: number }>): EventGeoJSON {
  return {
    type: 'FeatureCollection',
    features: events
      .filter((e) => e.lng != null && e.lat != null)
      .map((e) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [e.lng!, e.lat!] as [number, number],
        },
        properties: {
          id: e.id,
          name: e.name,
          slug: e.slug,
          category: e.category as 'festival' | 'wildlife',
          description: null,
          image_url: null,
          start_month: 0,
          end_month: 0,
          scale: 0,
          crowd_level: null,
          country: null,
          region: null,
          booking_destination_id: null,
          getyourguide_location_id: null,
        },
      })),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  const regionName = deslugify(region);
  const events = await getWildlifeByRegion(regionName);

  const noindex = shouldNoindex(events.length);
  const title = `Wildlife Viewing in ${regionName} - Migration Routes & Tours`;
  const description = `Discover ${events.length} wildlife migration events across ${regionName}. Find peak viewing months, routes, and guided wildlife tours.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://happeningnow.travel/wildlife/region/${region}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function WildlifeRegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  const regionName = deslugify(region);
  const events = await getWildlifeByRegion(regionName);

  if (events.length === 0) {
    notFound();
  }

  // Extract top species from events for intro template
  const speciesCounts = new Map<string, number>();
  for (const event of events) {
    const species = event.name.split(' ')[0];
    speciesCounts.set(species, (speciesCounts.get(species) ?? 0) + 1);
  }
  const topSpecies = Array.from(speciesCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  const intro = getWildlifeRegionIntro(events.length, regionName, topSpecies);
  const title = `Wildlife Viewing in ${regionName}`;

  // Build GeoJSON for map
  const geoJSON = eventsToGeoJSON(events as unknown as Array<{ id: string; name: string; slug: string; category: string; lng?: number; lat?: number }>);

  // Related links: region overview + month sub-pages
  const relatedLinks = getRelatedWildlifeLinks(regionName, null, null);

  // Add month links for this region (1-12)
  const monthLinks = Array.from({ length: 12 }, (_, i) => ({
    href: `/wildlife/region/${region}/${i + 1}`,
    label: `${regionName} wildlife in ${MONTH_NAMES[i + 1]}`,
  }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wildlife', href: '/' },
    { name: regionName },
  ];

  return (
    <SeoPageLayout
      title={title}
      intro={intro}
      breadcrumbs={breadcrumbs}
      relatedLinks={[...relatedLinks, ...monthLinks].slice(0, 8)}
      eventCategory="wildlife"
    >
      <FilteredMap events={geoJSON} />
      <div className="mt-8">
        <EventCardGrid events={events} />
      </div>
    </SeoPageLayout>
  );
}

const MONTH_NAMES: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
};
