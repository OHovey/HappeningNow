import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWhatToDoData, getAllDestinationSlugs, deslugify } from '@/lib/supabase/seo-queries';
import { getWhatToDoIntro } from '@/lib/seo/intro-templates';
import { shouldNoindex } from '@/lib/seo/thin-page-check';
import { getRelatedWhatToDoLinks } from '@/lib/seo/internal-links';
import { formatWeatherSummary, formatTemperature } from '@/lib/destination-utils';
import { crowdScoreToColor, crowdScoreToLabel, estimateTouristVolume } from '@/lib/crowd-colors';
import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import SeoPageLayout from '@/components/seo/SeoPageLayout';
import EventCardGrid from '@/components/seo/EventCardGrid';
import FilteredMap from '@/components/seo/FilteredMap';
import FtcDisclosure from '@/components/ui/FtcDisclosure';
import type { EventGeoJSON } from '@/lib/supabase/types';

export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface PageProps {
  params: Promise<{ destination: string; month: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { destination: destinationSlug, month: monthStr } = await params;
  const month = parseInt(monthStr, 10);

  if (isNaN(month) || month < 1 || month > 12) {
    notFound();
  }

  const { events, destination, crowdScore, weatherSummary } = await getWhatToDoData(
    destinationSlug,
    month,
  );

  if (!destination) {
    notFound();
  }

  const monthName = MONTH_NAMES[month];
  const crowdLevel = crowdScore !== null ? crowdScoreToLabel(crowdScore) : '';
  const hasWeatherData = weatherSummary !== null;
  const hasCrowdData = crowdScore !== null;
  const noindex = shouldNoindex(events.length, hasWeatherData, hasCrowdData);

  const intro = getWhatToDoIntro(
    events.length,
    destination.name,
    monthName,
    crowdLevel,
    weatherSummary ?? '',
  );

  return {
    title: `What to Do in ${destination.name} in ${monthName} | HappeningNow`,
    description: intro,
    alternates: {
      canonical: `https://happeningnow.travel/what-to-do/${destinationSlug}/${month}`,
    },
    openGraph: {
      title: `What to Do in ${destination.name} in ${monthName}`,
      description: intro,
      type: 'article',
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function WhatToDoPage({ params }: PageProps) {
  const { destination: destinationSlug, month: monthStr } = await params;
  const month = parseInt(monthStr, 10);

  if (isNaN(month) || month < 1 || month > 12) {
    notFound();
  }

  const { events, destination, crowdScore, weatherSummary } = await getWhatToDoData(
    destinationSlug,
    month,
  );

  if (!destination) {
    notFound();
  }

  const monthName = MONTH_NAMES[month];
  const crowdLevel = crowdScore !== null ? crowdScoreToLabel(crowdScore) : null;
  const crowdColor = crowdScore !== null ? crowdScoreToColor(crowdScore) : null;
  const touristVolume = crowdScore !== null ? estimateTouristVolume(crowdScore) : null;

  // Weather data from destination
  const monthKey = String(month);
  const weather = destination.weather_data?.[monthKey] ?? null;
  const formattedWeather = weather ? formatWeatherSummary(weather) : null;

  const intro = getWhatToDoIntro(
    events.length,
    destination.name,
    monthName,
    crowdLevel ?? '',
    weatherSummary ?? '',
  );

  // Build GeoJSON for the map
  const eventsGeoJSON: EventGeoJSON = {
    type: 'FeatureCollection',
    features: events
      .filter((e) => e.location)
      .map((e) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          // Events with location data — cast through unknown for PostGIS geometry
          coordinates: [0, 0] as [number, number],
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
      })),
  };

  // Internal links
  const allDestinations = await getAllDestinationSlugs();
  const allDestinationNames = allDestinations.map((s) => deslugify(s));
  const relatedLinks = getRelatedWhatToDoLinks(
    destination.name,
    month,
    allDestinationNames,
  );

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'What to Do', href: '/what-to-do' },
    { name: destination.name, href: `/destination/${destinationSlug}` },
    { name: monthName },
  ];

  // Booking.com link pre-filled with destination + month
  const bookingUrl = buildBookingLink({
    destinationId: destination.booking_destination_id,
    city: destination.name,
    startMonth: month,
  });

  const gygUrl = buildGetYourGuideLink({
    query: `${destination.name} tours ${monthName}`,
  });

  return (
    <SeoPageLayout
      title={`What to Do in ${destination.name} in ${monthName}`}
      intro={intro}
      breadcrumbs={breadcrumbs}
      relatedLinks={relatedLinks}
    >
      {/* Weather & Crowd Summary */}
      {(weather || crowdScore !== null) && (
        <section data-section="weather" className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Weather &amp; Crowds in {monthName}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Crowd level card */}
            {crowdScore !== null && crowdLevel && crowdColor && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: crowdColor }}
                    aria-hidden="true"
                  />
                  <span className="text-lg font-semibold text-gray-900">{crowdLevel}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {monthName} is {crowdLevel.toLowerCase()} in {destination.name}
                  {touristVolume ? ` — ${touristVolume.toLowerCase()}` : ''}.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Crowd score: {crowdScore}/10
                </p>
              </div>
            )}

            {/* Weather summary card */}
            {weather && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Weather</h3>
                <p className="text-sm text-gray-600">{formattedWeather}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Avg temp: {formatTemperature(weather.temp_c)}</span>
                  <span>{weather.rain_days} rain days</span>
                  <span>{weather.sunshine_hours}h sunshine</span>
                </div>
              </div>
            )}
          </div>

          {/* Tourist volume estimate */}
          {touristVolume && (
            <p className="mt-3 text-sm text-gray-500">
              Estimated tourist volume: {touristVolume}
            </p>
          )}
        </section>
      )}

      {/* Events section */}
      <section data-section="events" className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Events in {destination.name} in {monthName}
        </h2>

        {events.length > 0 && (
          <div className="mb-6">
            <FilteredMap events={eventsGeoJSON} />
          </div>
        )}

        <EventCardGrid events={events} />
      </section>

      {/* Booking section */}
      <section data-section="booking" className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Book Your Stay in {destination.name}
        </h2>
        <p className="text-gray-600 mb-4">
          Book your stay in {destination.name} for {monthName} and be close to the action.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Book on Booking.com
          </a>
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Find Tours on GetYourGuide
          </a>
        </div>
        <div className="mt-3">
          <FtcDisclosure />
        </div>
      </section>
    </SeoPageLayout>
  );
}
