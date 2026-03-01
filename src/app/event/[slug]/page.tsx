import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEventBySlug, getAllEventSlugs, getNearbyEvents } from '@/lib/supabase/queries';
import { buildEventJsonLd, buildEventMetadata } from '@/lib/structured-data';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EventHero from '@/components/detail/EventHero';
import EventContent from '@/components/detail/EventContent';
import NearbyEvents from '@/components/detail/NearbyEvents';
import BackToMap from '@/components/ui/BackToMap';

/**
 * Generate static paths for all events at build time.
 */
export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Dynamic metadata for OG tags and page title.
 * Uses Next.js 15+ pattern: params is a Promise.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: 'Event Not Found' };
  }

  return buildEventMetadata(event);
}

/**
 * Event detail page — async Server Component.
 *
 * Renders hero image, breadcrumbs, event content with mini map,
 * affiliate CTAs, nearby events, JSON-LD Event structured data,
 * and a floating Back to Map button.
 */
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const nearbyEvents = await getNearbyEvents(event);

  // Build JSON-LD structured data
  const eventJsonLd = buildEventJsonLd(event);

  // Breadcrumb items: Home > Region > Event Name
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    ...(event.region
      ? [
          {
            name: event.region,
            href: `/festivals/${slugify(event.region)}`,
          },
        ]
      : event.country
        ? [
            {
              name: event.country,
              href: `/festivals/${slugify(event.country)}`,
            },
          ]
        : []),
    { name: event.name },
  ];

  // Note: coordinates are not directly available from the events table
  // because PostGIS geometry is stored as WKB. For now, coordinates
  // are omitted from the MiniMap. A future RPC or view can expose
  // ST_X(location) and ST_Y(location) for map rendering.
  // TODO: Add RPC to extract lat/lng from event geometry

  return (
    <>
      {/* Event JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Breadcrumbs items={breadcrumbItems} />
      <EventHero event={event} />
      <EventContent event={event} />
      <NearbyEvents events={nearbyEvents} />
      <BackToMap />
    </>
  );
}

/**
 * Simple slugify for breadcrumb URLs.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
