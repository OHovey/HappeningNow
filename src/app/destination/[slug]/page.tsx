import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getDestinationBySlug,
  getAllDestinationSlugs,
  getEventsByDestination,
} from '@/lib/supabase/queries';
import { computeBestMonths } from '@/lib/destination-utils';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import DestinationHero from '@/components/destination/DestinationHero';
import BestTimeToVisit from '@/components/destination/BestTimeToVisit';
import CalendarGrid from '@/components/destination/CalendarGrid';
import BookingWidget from '@/components/destination/BookingWidget';
import BackToMap from '@/components/ui/BackToMap';

/**
 * Generate static paths for all destinations at build time.
 */
export async function generateStaticParams() {
  const slugs = await getAllDestinationSlugs();
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
  const destination = await getDestinationBySlug(slug);

  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  const { months } = computeBestMonths(
    destination.crowd_data,
    destination.weather_data,
  );

  const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const bestMonthNames = months.map((m) => MONTH_NAMES[m]).join(', ');
  const description = `Best times to visit ${destination.name}: ${bestMonthNames}. See crowd levels, weather, and events for every month of the year.`;

  return {
    title: `${destination.name} \u2014 Best Times to Visit | HappeningNow`,
    description,
    openGraph: {
      title: `${destination.name} \u2014 Best Times to Visit`,
      description,
      type: 'article',
    },
  };
}

/**
 * Destination detail page - async Server Component.
 *
 * Renders hero, best-time-to-visit, 12-month calendar grid,
 * Booking.com widget, breadcrumbs, JSON-LD, and back-to-map button.
 */
export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const events = await getEventsByDestination(destination);

  const { months: bestMonths } = computeBestMonths(
    destination.crowd_data,
    destination.weather_data,
  );

  // JSON-LD TouristDestination structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destination.name,
    description: `Explore ${destination.name} in ${destination.country}. Discover the best times to visit based on crowd levels, weather, and local events.`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: destination.country,
      ...(destination.region ? { addressRegion: destination.region } : {}),
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.lat,
      longitude: destination.lng,
    },
  };

  // Breadcrumb items: Home > Destinations > Destination Name
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Destinations', href: '/destinations' },
    { name: destination.name },
  ];

  return (
    <>
      {/* TouristDestination JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Breadcrumbs items={breadcrumbItems} />
      <DestinationHero destination={destination} />

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        <BestTimeToVisit
          crowdData={destination.crowd_data}
          weatherData={destination.weather_data}
        />

        <CalendarGrid destination={destination} events={events} />

        <BookingWidget
          destId={destination.booking_destination_id ?? null}
          destName={destination.name}
          bestMonth={bestMonths[0]}
        />
      </div>

      <BackToMap />
    </>
  );
}
