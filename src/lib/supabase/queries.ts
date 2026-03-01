import { createServerClient } from '@/lib/supabase/server';
import type { Event, EventWithCoords, MigrationRoute, MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

/**
 * Fetch a single event by slug with extracted coordinates.
 * Uses the get_event_with_coords RPC to extract PostGIS geometry as lng/lat.
 * Returns the event row with coordinates or null if not found.
 */
export async function getEventBySlug(slug: string): Promise<EventWithCoords | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_event_with_coords', {
    event_slug: slug,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as EventWithCoords;
}

/**
 * Fetch all event slugs for generateStaticParams.
 */
export async function getAllEventSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('events').select('slug');
  return (data ?? []).map((e) => e.slug);
}

/**
 * Fetch nearby events: same region OR overlapping month range.
 * Excludes the current event. Returns up to `limit` results (default 4).
 *
 * Primary criterion: same region.
 * Secondary criterion: temporal overlap (month ranges intersect).
 */
export async function getNearbyEvents(
  event: Event,
  limit: number = 4,
): Promise<Event[]> {
  const supabase = createServerClient();

  // First try: same region
  if (event.region) {
    const { data: regionEvents } = await supabase
      .from('events')
      .select('*')
      .eq('region', event.region)
      .neq('id', event.id)
      .limit(limit);

    if (regionEvents && regionEvents.length > 0) {
      return regionEvents;
    }
  }

  // Fallback: same country
  if (event.country) {
    const { data: countryEvents } = await supabase
      .from('events')
      .select('*')
      .eq('country', event.country)
      .neq('id', event.id)
      .limit(limit);

    if (countryEvents && countryEvents.length > 0) {
      return countryEvents;
    }
  }

  // Last resort: any events with overlapping months
  // We can't do complex month overlap in a single query easily,
  // so fetch a broader set and filter client-side
  const { data: allEvents } = await supabase
    .from('events')
    .select('*')
    .neq('id', event.id)
    .limit(50);

  if (!allEvents) return [];

  const overlapping = allEvents.filter((e) => {
    return monthsOverlap(
      event.start_month,
      event.end_month,
      e.start_month,
      e.end_month,
    );
  });

  return overlapping.slice(0, limit);
}

/**
 * Check if two month ranges overlap (handles wrap-around, e.g. Nov-Feb).
 */
function monthsOverlap(
  s1: number,
  e1: number,
  s2: number,
  e2: number,
): boolean {
  const range1 = expandMonthRange(s1, e1);
  const range2 = expandMonthRange(s2, e2);
  return range1.some((m) => range2.includes(m));
}

function expandMonthRange(start: number, end: number): number[] {
  const months: number[] = [];
  if (start <= end) {
    for (let m = start; m <= end; m++) months.push(m);
  } else {
    // Wraps around December -> January
    for (let m = start; m <= 12; m++) months.push(m);
    for (let m = 1; m <= end; m++) months.push(m);
  }
  return months;
}

/**
 * Fetch a single migration route by slug with route geometry as GeoJSON.
 * Uses the get_wildlife_with_route RPC to extract PostGIS geometry as GeoJSON coordinates.
 */
export async function getWildlifeBySlug(
  slug: string,
): Promise<MigrationRouteWithGeoJSON | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_wildlife_with_route', {
    route_slug: slug,
  });

  if (error || !data || data.length === 0) return null;
  return data[0] as MigrationRouteWithGeoJSON;
}

/**
 * Fetch all wildlife slugs for generateStaticParams.
 */
export async function getAllWildlifeSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('migration_routes').select('slug');
  return (data ?? []).map((r) => r.slug);
}
