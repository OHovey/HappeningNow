/**
 * Shared types for the data ingestion pipeline.
 * All source adapters output RawEvent[], which the normaliser processes into DB rows.
 */

import type { EventCategory } from '@/lib/supabase/types';

export interface RawEvent {
  /** Event name as provided by the source */
  name: string;
  /** Free-text description (nullable) */
  description: string | null;
  /** Image URL from source (nullable) */
  image_url: string | null;
  /** Event category */
  category: EventCategory;
  /** Raw Ticketmaster segment name (for future use) */
  tm_segment?: string | null;
  /** Raw Ticketmaster genre name (for future use) */
  tm_genre?: string | null;
  /** Exact start date if available (ISO 8601 date string) */
  start_date: string | null;
  /** Exact end date if available (ISO 8601 date string) */
  end_date: string | null;
  /** Month-based start (1-12) for recurring/seasonal events */
  start_month: number | null;
  /** Month-based end (1-12) for recurring/seasonal events */
  end_month: number | null;
  /** Latitude (nullable — will be geocoded if missing) */
  lat: number | null;
  /** Longitude (nullable — will be geocoded if missing) */
  lng: number | null;
  /** Location name for geocoding fallback */
  location_name: string | null;
  /** Country name */
  country: string | null;
  /** Region / state / province */
  region: string | null;
  /** Scale 1-10 (default 5) */
  scale: number;
  /** Crowd level hint */
  crowd_level: 'quiet' | 'moderate' | 'busy' | null;
  /** Source identifier */
  source: 'ticketmaster' | 'wikipedia' | 'apify_tourism' | 'apify_wildlife' | 'manual';
  /** External ID from the source for deduplication */
  source_id: string | null;
  /** Confidence score: 1.0 = authoritative, 0.5-0.9 = scraped */
  confidence: number;
  /** Venue name (for display) */
  venue_name: string | null;
  /** Source URL for attribution */
  source_url: string | null;
  /** Booking.com destination ID if known */
  booking_destination_id: string | null;
  /** GetYourGuide location ID if known */
  getyourguide_location_id: string | null;
}

/** Result of a source adapter fetch */
export interface SourceResult {
  source: string;
  events: RawEvent[];
  errors: string[];
}

/** A source adapter must export this function */
export type SourceAdapter = () => Promise<SourceResult>;
