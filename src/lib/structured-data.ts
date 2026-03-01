import type { WithContext, Event as EventSchema } from 'schema-dts';
import type { Metadata } from 'next';
import type { Event, MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

/**
 * Builds Event JSON-LD structured data for a given event.
 * Handles year computation: if event start_month has passed this year, use next year.
 */
export function buildEventJsonLd(event: Event): WithContext<EventSchema> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // If the event's start month has already passed, use next year
  const year = event.start_month < currentMonth ? currentYear + 1 : currentYear;

  const startDate = `${year}-${String(event.start_month).padStart(2, '0')}-01`;

  // End date: if end_month < start_month, it wraps into next year
  const endYear = event.end_month < event.start_month ? year + 1 : year;
  const endDate = `${endYear}-${String(event.end_month).padStart(2, '0')}-28`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description ?? `Discover ${event.name}`,
    startDate,
    endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.region ?? event.country ?? 'Unknown',
      address: {
        '@type': 'PostalAddress',
        addressCountry: event.country ?? '',
        addressRegion: event.region ?? '',
      },
    },
    ...(event.image_url ? { image: event.image_url } : {}),
  };
}

/**
 * Builds Next.js Metadata for an event detail page.
 */
export function buildEventMetadata(event: Event): Metadata {
  const description = event.description ?? `Discover ${event.name}`;

  return {
    title: event.name,
    description,
    openGraph: {
      title: event.name,
      description,
      type: 'article',
      images: event.image_url ? [{ url: event.image_url }] : [],
    },
  };
}

const MONTH_NAMES_FULL = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Builds Event JSON-LD structured data for a wildlife migration spectacle.
 * Wildlife spectacles are modeled as schema.org Events (seasonal natural events).
 */
export function buildWildlifeJsonLd(
  route: MigrationRouteWithGeoJSON,
): WithContext<EventSchema> {
  const peakMonths = route.peak_months ?? [];
  const firstMonth = peakMonths.length > 0 ? peakMonths[0] : 1;
  const lastMonth = peakMonths.length > 0 ? peakMonths[peakMonths.length - 1] : 12;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const year = firstMonth < currentMonth ? currentYear + 1 : currentYear;
  const startDate = `${year}-${String(firstMonth).padStart(2, '0')}-01`;

  const endYear = lastMonth < firstMonth ? year + 1 : year;
  const endDate = `${endYear}-${String(lastMonth).padStart(2, '0')}-28`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: route.name,
    description: route.description ?? `Discover the ${route.species} migration`,
    startDate,
    endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: `${route.species} migration`,
    },
    ...(route.image_url ? { image: route.image_url } : {}),
  };
}

/**
 * Format peak months array as a display string.
 * e.g. [6, 7, 8] -> "June - August"
 * e.g. [3] -> "March"
 */
export function formatPeakMonths(months: number[]): string {
  if (!months || months.length === 0) return 'Year-round';
  if (months.length === 1) return MONTH_NAMES_FULL[months[0]] || '';
  const first = MONTH_NAMES_FULL[months[0]] || '';
  const last = MONTH_NAMES_FULL[months[months.length - 1]] || '';
  return `${first} - ${last}`;
}

/**
 * Builds Next.js Metadata for a wildlife detail page.
 * OG image uses the wildlife photo directly per user decision.
 */
export function buildWildlifeMetadata(route: MigrationRouteWithGeoJSON): Metadata {
  const description =
    route.description ?? `Discover the ${route.species} migration - ${route.name}`;
  const title = `${route.species} - ${route.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: route.image_url ? [{ url: route.image_url }] : [],
    },
  };
}
