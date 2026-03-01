import type { WithContext, Event as EventSchema } from 'schema-dts';
import type { Metadata } from 'next';
import type { Event } from '@/lib/supabase/types';

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
