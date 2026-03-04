/**
 * Ticketmaster Discovery API source adapter.
 *
 * Fetches events from /discovery/v2/events.json across multiple countries
 * and classifications. Free tier: 5,000 calls/day.
 *
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

import type { EventCategory } from '@/lib/supabase/types';
import type { RawEvent, SourceResult } from '../types';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

/** Countries to query (ISO 3166-1 alpha-2) — major markets first */
const COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE',
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ',
  'MX', 'BR', 'JP', 'NZ', 'ZA', 'SG', 'AE', 'IN', 'TH', 'KR',
];

/** Ticketmaster classification segments to include */
const CLASSIFICATIONS = ['Music', 'Arts & Theatre', 'Sports', 'Film', 'Miscellaneous'];

/** Max pages to fetch per country/classification combo */
const MAX_PAGES = 3;

/** Delay between API calls in ms to stay within rate limits */
const CALL_DELAY_MS = 250;

/** Major promoters — events from these are kept even for non-festival categories */
const MAJOR_PROMOTERS = [
  'live nation',
  'aeg',
  'aeg presents',
  'goldenvoice',
  'insomniac',
  'c3 presents',
  'bowery presents',
  'another planet entertainment',
  'msg entertainment',
  'anschutz entertainment',
  'ticketmaster',
  'stubhub',
  'livenation',
  'promotion in motion',
  'concerts west',
  'jam productions',
  'sfx entertainment',
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface TmEvent {
  id: string;
  name: string;
  url?: string;
  images?: Array<{ url: string; ratio?: string; width?: number }>;
  dates?: {
    start?: { localDate?: string };
    end?: { localDate?: string };
    status?: { code?: string };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  promoter?: { name?: string };
  promoters?: Array<{ name?: string }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
      country?: { name?: string; countryCode?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
}

interface TmResponse {
  _embedded?: {
    events?: TmEvent[];
  };
  page?: {
    totalElements?: number;
    totalPages?: number;
    number?: number;
  };
}

function mapStatus(tmStatus: string | undefined): 'active' | 'cancelled' | 'postponed' {
  switch (tmStatus) {
    case 'cancelled': return 'cancelled';
    case 'postponed': case 'rescheduled': return 'postponed';
    default: return 'active';
  }
}

function pickBestImage(images: TmEvent['images']): string | null {
  if (!images?.length) return null;
  // Prefer 16:9 ratio, then largest
  const preferred = images.find(i => i.ratio === '16_9' && (i.width ?? 0) >= 640);
  return preferred?.url || images[0]?.url || null;
}

/** Check if event has a major promoter attached */
function hasMajorPromoter(tm: TmEvent): boolean {
  const names: string[] = [];
  if (tm.promoter?.name) names.push(tm.promoter.name.toLowerCase());
  if (tm.promoters) {
    for (const p of tm.promoters) {
      if (p.name) names.push(p.name.toLowerCase());
    }
  }
  return names.some(n => MAJOR_PROMOTERS.some(mp => n.includes(mp)));
}

/** Classify a TM event into our category system and decide whether to keep it */
function classifyTmEvent(tm: TmEvent): { category: EventCategory; keep: boolean; segment: string | null; genre: string | null } {
  const segment = tm.classifications?.[0]?.segment?.name ?? null;
  const genre = tm.classifications?.[0]?.genre?.name ?? null;
  const subGenre = tm.classifications?.[0]?.subGenre?.name ?? null;
  const nameLower = tm.name.toLowerCase();
  const isMajor = hasMajorPromoter(tm);

  // Festival detection: genre is "Festival" OR (Music segment + name/subgenre contains "fest")
  if (
    genre?.toLowerCase() === 'festival' ||
    (segment === 'Music' && (nameLower.includes('fest') || subGenre?.toLowerCase().includes('fest')))
  ) {
    return { category: 'festival', keep: true, segment, genre };
  }

  // Music → concert (keep only with major promoter)
  if (segment === 'Music') {
    return { category: 'concert', keep: isMajor, segment, genre };
  }

  // Sports
  if (segment === 'Sports') {
    return { category: 'sport', keep: isMajor, segment, genre };
  }

  // Arts & Theatre
  if (segment === 'Arts & Theatre') {
    return { category: 'arts', keep: isMajor, segment, genre };
  }

  // Everything else (Film, Miscellaneous, etc.)
  return { category: 'event', keep: isMajor, segment, genre };
}

function parseTmEvent(tm: TmEvent): RawEvent | null {
  const venue = tm._embedded?.venues?.[0];
  const lat = venue?.location?.latitude ? parseFloat(venue.location.latitude) : null;
  const lng = venue?.location?.longitude ? parseFloat(venue.location.longitude) : null;

  const startDate = tm.dates?.start?.localDate || null;
  const endDate = tm.dates?.end?.localDate || null;
  const status = mapStatus(tm.dates?.status?.code);

  // Skip events with no useful location info
  const locationName = venue?.city?.name || venue?.name || null;
  if (!lat && !lng && !locationName) return null;

  const { category, keep, segment, genre } = classifyTmEvent(tm);
  if (!keep) return null;

  const country = venue?.country?.name || null;
  const region = venue?.state?.name || venue?.city?.name || null;

  return {
    name: tm.name,
    description: null,
    image_url: pickBestImage(tm.images),
    category,
    tm_segment: segment,
    tm_genre: genre,
    start_date: startDate,
    end_date: endDate,
    start_month: null, // derived from dates in normaliser
    end_month: null,
    lat,
    lng,
    location_name: locationName,
    country,
    region,
    scale: 5,
    crowd_level: null,
    source: 'ticketmaster',
    source_id: tm.id,
    confidence: 1.0,
    venue_name: venue?.name || null,
    source_url: tm.url || null,
    booking_destination_id: null,
    getyourguide_location_id: null,
  };
}

async function fetchPage(
  apiKey: string,
  countryCode: string,
  classificationName: string,
  page: number,
): Promise<TmResponse | null> {
  const params = new URLSearchParams({
    apikey: apiKey,
    countryCode,
    classificationName,
    size: '200',
    page: String(page),
    sort: 'date,asc',
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited — back off
        await sleep(5000);
        return null;
      }
      return null;
    }
    return await res.json() as TmResponse;
  } catch {
    return null;
  }
}

export async function fetchTicketmasterEvents(apiKey: string): Promise<SourceResult> {
  const events: RawEvent[] = [];
  const errors: string[] = [];
  let totalCalls = 0;

  for (const country of COUNTRIES) {
    for (const classification of CLASSIFICATIONS) {
      for (let page = 0; page < MAX_PAGES; page++) {
        await sleep(CALL_DELAY_MS);
        totalCalls++;

        // Safety: don't exceed 4,500 calls in a single run (leave headroom)
        if (totalCalls > 4500) {
          errors.push('Approaching daily call limit, stopping early');
          return { source: 'ticketmaster', events, errors };
        }

        const data = await fetchPage(apiKey, country, classification, page);
        if (!data?._embedded?.events?.length) break;

        for (const tm of data._embedded.events) {
          const parsed = parseTmEvent(tm);
          if (parsed) events.push(parsed);
        }

        // No more pages
        const totalPages = data.page?.totalPages ?? 1;
        if (page >= totalPages - 1) break;
      }
    }
  }

  console.log(`[ticketmaster] Fetched ${events.length} events in ${totalCalls} API calls`);
  return { source: 'ticketmaster', events, errors };
}
