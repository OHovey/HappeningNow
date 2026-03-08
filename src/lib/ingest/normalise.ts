/**
 * Shared normalisation pipeline for all data sources.
 *
 * Steps:
 * 1. Generate slug from event name
 * 2. Geocode missing coordinates via Nominatim
 * 3. Deduplicate (same source_id, or Levenshtein distance < 3 on name + same country + overlapping dates)
 * 4. Derive month fields from dates if missing
 * 5. Upsert to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { RawEvent } from './types';

const USER_AGENT = 'HappeningNow.travel/1.0 ingest-pipeline (contact: admin@happeningnow.travel)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 200);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Simple Levenshtein distance for dedup.
 * Only computes up to maxDist to short-circuit.
 */
function levenshtein(a: string, b: string, maxDist = 3): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      rowMin = Math.min(rowMin, dp[i][j]);
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return dp[m][n];
}

// ---------------------------------------------------------------------------
// Geocoding via Nominatim
// ---------------------------------------------------------------------------

async function geocode(
  locationName: string,
  country: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const query = country ? `${locationName}, ${country}` : locationName;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Country centroid fallback for approximate locations
// ---------------------------------------------------------------------------

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'Thailand': { lat: 15.87, lng: 100.99 },
  'Indonesia': { lat: -0.79, lng: 113.92 },
  'India': { lat: 20.59, lng: 78.96 },
  'Japan': { lat: 36.20, lng: 138.25 },
  'China': { lat: 35.86, lng: 104.20 },
  'Kenya': { lat: -0.02, lng: 37.91 },
  'Tanzania': { lat: -6.37, lng: 34.89 },
  'South Africa': { lat: -30.56, lng: 22.94 },
  'Botswana': { lat: -22.33, lng: 24.68 },
  'Costa Rica': { lat: 9.75, lng: -83.75 },
  'Brazil': { lat: -14.24, lng: -51.93 },
  'Peru': { lat: -9.19, lng: -75.02 },
  'Mexico': { lat: 23.63, lng: -102.55 },
  'Colombia': { lat: 4.57, lng: -74.30 },
  'Australia': { lat: -25.27, lng: 133.78 },
  'New Zealand': { lat: -40.90, lng: 174.89 },
  'Nepal': { lat: 28.39, lng: 84.12 },
  'Sri Lanka': { lat: 7.87, lng: 80.77 },
  'Vietnam': { lat: 14.06, lng: 108.28 },
  'Philippines': { lat: 12.88, lng: 121.77 },
  'Malaysia': { lat: 4.21, lng: 101.98 },
  'Cambodia': { lat: 12.57, lng: 104.99 },
  'Myanmar': { lat: 21.91, lng: 95.96 },
  'Madagascar': { lat: -18.77, lng: 46.87 },
  'Uganda': { lat: 1.37, lng: 32.29 },
  'Rwanda': { lat: -1.94, lng: 29.87 },
  'Namibia': { lat: -22.96, lng: 18.49 },
  'Iceland': { lat: 64.96, lng: -19.02 },
  'Norway': { lat: 60.47, lng: 8.47 },
  'Ecuador': { lat: -1.83, lng: -78.18 },
};

const APIFY_SOURCES = new Set(['apify_tourism', 'apify_wildlife']);

// ---------------------------------------------------------------------------
// Normalise & Upsert
// ---------------------------------------------------------------------------

export interface NormaliseResult {
  inserted: number;
  updated: number;
  skipped: number;
  geocoded: number;
  errors: string[];
}

export async function normaliseAndUpsert(rawEvents: RawEvent[]): Promise<NormaliseResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { inserted: 0, updated: 0, skipped: 0, geocoded: 0, errors: ['Missing Supabase credentials'] };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const result: NormaliseResult = { inserted: 0, updated: 0, skipped: 0, geocoded: 0, errors: [] };

  // Deduplicate within the batch
  const seen = new Map<string, RawEvent>();

  for (const raw of rawEvents) {
    // Skip events with no name
    if (!raw.name?.trim()) {
      result.skipped++;
      continue;
    }

    // Source-level dedup: same source + source_id
    if (raw.source_id) {
      const key = `${raw.source}:${raw.source_id}`;
      if (seen.has(key)) {
        result.skipped++;
        continue;
      }
      seen.set(key, raw);
    } else {
      // Name-level dedup: Levenshtein < 3 on name + same country
      const nameKey = raw.name.toLowerCase().trim();
      let isDupe = false;
      for (const [, existing] of seen) {
        if (
          existing.country === raw.country &&
          levenshtein(nameKey, existing.name.toLowerCase().trim()) < 3
        ) {
          isDupe = true;
          break;
        }
      }
      if (isDupe) {
        result.skipped++;
        continue;
      }
      seen.set(`name:${nameKey}:${raw.country}`, raw);
    }
  }

  const dedupedEvents = Array.from(seen.values());

  for (const raw of dedupedEvents) {
    try {
      // Geocode if missing coordinates
      let lat = raw.lat;
      let lng = raw.lng;

      if ((lat == null || lng == null) && raw.location_name) {
        await sleep(1100); // Nominatim rate limit: 1 req/sec
        const coords = await geocode(raw.location_name, raw.country);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          result.geocoded++;
        }
      }

      // Country centroid fallback for Apify sources
      if (lat == null || lng == null) {
        if (APIFY_SOURCES.has(raw.source) && raw.country) {
          const centroid = COUNTRY_CENTROIDS[raw.country];
          if (centroid) {
            lat = centroid.lat;
            lng = centroid.lng;
            raw.location_approximate = true;
            raw.confidence = 0.5;
          }
        }
      }

      if (lat == null || lng == null) {
        result.errors.push(`No coordinates for: ${raw.name}`);
        result.skipped++;
        continue;
      }

      // Derive month fields from dates if not provided
      let startMonth = raw.start_month;
      let endMonth = raw.end_month;

      if (startMonth == null && raw.start_date) {
        startMonth = new Date(raw.start_date).getMonth() + 1;
      }
      if (endMonth == null && raw.end_date) {
        endMonth = new Date(raw.end_date).getMonth() + 1;
      }
      // Fallback: if we have start_month but no end_month, assume same month
      if (startMonth != null && endMonth == null) {
        endMonth = startMonth;
      }
      if (endMonth != null && startMonth == null) {
        startMonth = endMonth;
      }
      // Last fallback: default to month 1
      startMonth = startMonth ?? 1;
      endMonth = endMonth ?? 12;

      const slug = slugify(raw.name);

      // Check if event already exists (by source + source_id, or by slug)
      let existingId: string | null = null;

      if (raw.source_id) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('source', raw.source)
          .eq('source_id', raw.source_id)
          .maybeSingle();
        existingId = (existing as { id: string } | null)?.id ?? null;
      }

      if (!existingId) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        existingId = (existing as { id: string } | null)?.id ?? null;
      }

      const eventData = {
        name: raw.name.trim(),
        slug,
        category: raw.category,
        description: raw.description,
        image_url: raw.image_url,
        start_month: startMonth,
        end_month: endMonth,
        start_date: raw.start_date,
        end_date: raw.end_date,
        location: `SRID=4326;POINT(${lng} ${lat})`,
        country: raw.country,
        region: raw.region,
        scale: raw.scale,
        crowd_level: raw.crowd_level,
        source: raw.source,
        source_id: raw.source_id,
        confidence: raw.confidence,
        location_approximate: raw.location_approximate ?? false,
        last_confirmed_at: new Date().toISOString(),
        status: 'active' as const,
        booking_destination_id: raw.booking_destination_id,
        getyourguide_location_id: raw.getyourguide_location_id,
        tm_segment: raw.tm_segment ?? null,
        tm_genre: raw.tm_genre ?? null,
      };

      if (existingId) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', existingId);

        if (error) {
          result.errors.push(`Update failed for ${raw.name}: ${error.message}`);
        } else {
          result.updated++;
        }
      } else {
        // Insert new event
        const { error } = await supabase.from('events').insert(eventData);

        if (error) {
          // Handle slug conflict by appending source_id
          if (error.code === '23505' && raw.source_id) {
            const retryData = { ...eventData, slug: `${slug}-${raw.source_id.slice(0, 8)}` };
            const { error: retryError } = await supabase.from('events').insert(retryData);
            if (retryError) {
              result.errors.push(`Insert failed for ${raw.name}: ${retryError.message}`);
            } else {
              result.inserted++;
            }
          } else {
            result.errors.push(`Insert failed for ${raw.name}: ${error.message}`);
          }
        } else {
          result.inserted++;
        }
      }
    } catch (err) {
      result.errors.push(`Error processing ${raw.name}: ${(err as Error).message}`);
    }
  }

  return result;
}
