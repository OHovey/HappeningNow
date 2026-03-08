/**
 * Apify Wildlife Event Scraper source adapter.
 *
 * Reads the latest dataset from Oliver's custom Wildlife Actor.
 * Wildlife events primarily use month_start/month_end with null dates.
 */

import type { RawEvent, SourceResult } from '../types';
import { fetchApifyDataset, hashSourceId } from './apify-common';

interface ApifyWildlifeItem {
  name: string;
  description?: string | null;
  location_name?: string | null;
  country: string;
  start_date?: string | null;
  end_date?: string | null;
  month_start?: number | null;
  month_end?: number | null;
  source_url: string;
  image_url?: string | null;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export async function fetchApifyWildlifeEvents(): Promise<SourceResult> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_WILDLIFE_ACTOR_ID;

  if (!token || !actorId) {
    return {
      source: 'apify_wildlife',
      events: [],
      errors: ['Missing APIFY_TOKEN or APIFY_WILDLIFE_ACTOR_ID'],
    };
  }

  const errors: string[] = [];

  try {
    const items = (await fetchApifyDataset(actorId, token)) as ApifyWildlifeItem[];
    console.log(`[ingest] Apify wildlife: fetched ${items.length} items`);

    const events: RawEvent[] = [];

    for (const item of items) {
      if (!item.name?.trim() || !item.country?.trim()) {
        errors.push(`Skipped wildlife item with missing name or country`);
        continue;
      }

      events.push({
        name: item.name.trim(),
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        category: 'wildlife',
        start_date: item.start_date ?? null,
        end_date: item.end_date ?? null,
        start_month: item.month_start ?? null,
        end_month: item.month_end ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        location_name: item.location_name ?? null,
        country: item.country,
        region: null,
        scale: 5,
        crowd_level: null,
        source: 'apify_wildlife',
        source_id: hashSourceId(item.name, item.country, item.source_url),
        confidence: 0.7,
        venue_name: null,
        source_url: item.source_url,
        booking_destination_id: null,
        getyourguide_location_id: null,
      });
    }

    return { source: 'apify_wildlife', events, errors };
  } catch (err) {
    return {
      source: 'apify_wildlife',
      events: [],
      errors: [`Apify wildlife fetch failed: ${(err as Error).message}`],
    };
  }
}
