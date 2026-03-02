import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWildlifeBySpecies, deslugify, slugify } from '@/lib/supabase/seo-queries';
import { getWildlifeSpeciesIntro } from '@/lib/seo/intro-templates';
import { shouldNoindex } from '@/lib/seo/thin-page-check';
import { getRelatedWildlifeLinks } from '@/lib/seo/internal-links';
import SeoPageLayout from '@/components/seo/SeoPageLayout';
import EventCardGrid from '@/components/seo/EventCardGrid';
import FilteredMap from '@/components/seo/FilteredMap';
import type { Event, EventGeoJSON } from '@/lib/supabase/types';

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
  params: Promise<{ species: string }>;
}): Promise<Metadata> {
  const { species } = await params;
  const speciesName = deslugify(species);
  const events = await getWildlifeBySpecies(speciesName);

  const noindex = shouldNoindex(events.length);
  const title = `${speciesName} Migration - Viewing Locations & Tours`;
  const description = `Track ${events.length} ${speciesName} migration routes worldwide. Find peak viewing months, locations, and guided wildlife tours.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://happeningnow.travel/wildlife/species/${species}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function WildlifeSpeciesPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species } = await params;
  const speciesName = deslugify(species);
  const events = await getWildlifeBySpecies(speciesName);

  if (events.length === 0) {
    notFound();
  }

  // Group events by region for geographic organization
  const eventsByRegion = new Map<string, Event[]>();
  for (const event of events) {
    const region = event.region ?? 'Other';
    const regionEvents = eventsByRegion.get(region) ?? [];
    regionEvents.push(event);
    eventsByRegion.set(region, regionEvents);
  }

  const topRegions = Array.from(eventsByRegion.keys()).slice(0, 3);
  const intro = getWildlifeSpeciesIntro(events.length, speciesName, topRegions);
  const title = `${speciesName} Migration`;

  const geoJSON = eventsToGeoJSON(events as unknown as Array<{ id: string; name: string; slug: string; category: string; lng?: number; lat?: number }>);

  // Build related links: link to regions this species is found in + species detail page
  const relatedLinks = getRelatedWildlifeLinks(topRegions[0] ?? null, speciesName, null);

  // Add links to region pages for each region this species is in
  const regionLinks = Array.from(eventsByRegion.keys())
    .filter((r) => r !== 'Other')
    .map((r) => ({
      href: `/wildlife/region/${slugify(r)}`,
      label: `All wildlife in ${r}`,
    }));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Wildlife', href: '/' },
    { name: speciesName },
  ];

  return (
    <SeoPageLayout
      title={title}
      intro={intro}
      breadcrumbs={breadcrumbs}
      relatedLinks={[...relatedLinks, ...regionLinks].slice(0, 8)}
      eventCategory="wildlife"
    >
      <FilteredMap events={geoJSON} />

      {/* Group events by region */}
      {Array.from(eventsByRegion.entries()).map(([region, regionEvents]) => (
        <section key={region} className="mt-8" data-section={`region-${slugify(region)}`}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {speciesName} in {region}
          </h2>
          <EventCardGrid events={regionEvents} />
        </section>
      ))}
    </SeoPageLayout>
  );
}
