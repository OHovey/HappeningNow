import { createClient } from '@supabase/supabase-js';
import type { Event, EventWithCoords, DestinationWithCoords, MigrationRouteWithGeoJSON } from '@/lib/supabase/types';

function createServerClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

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
  event: Event | EventWithCoords,
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

// ---------------------------------------------------------------------------
// Destination queries
// ---------------------------------------------------------------------------

/**
 * Fetch all destinations with extracted coordinates.
 * Uses the get_destinations_with_coords RPC to extract PostGIS geometry as lng/lat.
 */
export async function getAllDestinationsWithCoords(): Promise<DestinationWithCoords[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_destinations_with_coords');

  if (error) {
    console.error('Failed to fetch destinations:', error);
    return [];
  }
  return (data ?? []) as DestinationWithCoords[];
}

/**
 * Fetch a single destination by slug with coordinates.
 */
export async function getDestinationBySlug(slug: string): Promise<DestinationWithCoords | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('get_destinations_with_coords');

  if (error || !data) return null;
  const destinations = data as DestinationWithCoords[];
  return destinations.find((d) => d.slug === slug) ?? null;
}

/**
 * Fetch all destination slugs for generateStaticParams.
 */
export async function getAllDestinationSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('destinations').select('slug');
  return (data ?? []).map((d) => d.slug);
}

/**
 * Fetch events matching a destination's region or country.
 * Used for the calendar grid on destination pages.
 */
export async function getEventsByDestination(destination: DestinationWithCoords): Promise<Event[]> {
  const supabase = createServerClient();

  // Primary: match region
  if (destination.region) {
    const { data: regionEvents } = await supabase
      .from('events')
      .select('*')
      .eq('region', destination.region)
      .limit(20);

    if (regionEvents && regionEvents.length > 0) {
      return regionEvents;
    }
  }

  // Fallback: match country
  const { data: countryEvents } = await supabase
    .from('events')
    .select('*')
    .eq('country', destination.country)
    .limit(20);

  return countryEvents ?? [];
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
