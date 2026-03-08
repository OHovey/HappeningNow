/**
 * Apify Tourism Board Scraper source adapter.
 *
 * Reads the latest dataset from Oliver's custom Tourism Board Actor.
 * Apify schedules the Actor runs; this adapter just fetches the results.
 */

import type { RawEvent, SourceResult } from '../types';
import { fetchApifyDataset, hashSourceId } from './apify-common';

interface ApifyTourismItem {
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

export async function fetchApifyTourismEvents(): Promise<SourceResult> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_TOURISM_ACTOR_ID;

  if (!token || !actorId) {
    return {
      source: 'apify_tourism',
      events: [],
      errors: ['Missing APIFY_TOKEN or APIFY_TOURISM_ACTOR_ID'],
    };
  }

  const errors: string[] = [];

  try {
    const items = (await fetchApifyDataset(actorId, token)) as ApifyTourismItem[];
    console.log(`[ingest] Apify tourism: fetched ${items.length} items`);

    const events: RawEvent[] = [];

    for (const item of items) {
      if (!item.name?.trim() || !item.country?.trim()) {
        errors.push(`Skipped tourism item with missing name or country`);
        continue;
      }

      events.push({
        name: item.name.trim(),
        description: item.description ?? null,
        image_url: item.image_url ?? null,
        category: 'festival',
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
        source: 'apify_tourism',
        source_id: hashSourceId(item.name, item.country, item.source_url),
        confidence: 0.7,
        venue_name: null,
        source_url: item.source_url,
        booking_destination_id: null,
        getyourguide_location_id: null,
      });
    }

    return { source: 'apify_tourism', events, errors };
  } catch (err) {
    return {
      source: 'apify_tourism',
      events: [],
      errors: [`Apify tourism fetch failed: ${(err as Error).message}`],
    };
  }
}
