/**
 * Supabase query functions for programmatic SEO pages.
 *
 * Uses the server client for SSR/SSG data fetching.
 * All queries return typed results matching the schema in types.ts.
 *
 * Note: Type assertions (as Event[], as Destination, etc.) are used
 * because the minimal Database type in types.ts does not provide full
 * column-level type inference for supabase-js `.select('*')` calls.
 * This matches the pattern used in the existing queries.ts.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Event, Destination } from '@/lib/supabase/types';

// ---------------------------------------------------------------------------
// Slug utilities
// ---------------------------------------------------------------------------

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function deslugify(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Festival queries
// ---------------------------------------------------------------------------

/**
 * Fetch festivals by region and month.
 * Region matching is case-insensitive.
 * Month checks if the event's start_month-end_month range includes the target month.
 */
export async function getFestivalsByRegionMonth(
  region: string,
  month: number,
): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'festival')
    .ilike('region', region)
    .lte('start_month', month)
    .gte('end_month', month)
    .order('name');

  if (error) {
    console.error('getFestivalsByRegionMonth error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

/**
 * Fetch all festivals in a country.
 */
export async function getFestivalsByCountry(country: string): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'festival')
    .ilike('country', country)
    .order('start_month', { ascending: true });

  if (error) {
    console.error('getFestivalsByCountry error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

/**
 * Fetch festivals by country and month.
 */
export async function getFestivalsByCountryMonth(
  country: string,
  month: number,
): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'festival')
    .ilike('country', country)
    .lte('start_month', month)
    .gte('end_month', month)
    .order('name');

  if (error) {
    console.error('getFestivalsByCountryMonth error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

// ---------------------------------------------------------------------------
// Wildlife queries
// ---------------------------------------------------------------------------

/**
 * Fetch wildlife events by region.
 */
export async function getWildlifeByRegion(region: string): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'wildlife')
    .ilike('region', region)
    .order('name');

  if (error) {
    console.error('getWildlifeByRegion error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

/**
 * Fetch wildlife events by species (via migration_routes join).
 * Falls back to name-based search if no migration route matches.
 */
export async function getWildlifeBySpecies(species: string): Promise<Event[]> {
  const supabase = createServerClient();

  // First: find migration routes matching the species
  const { data: routes } = await supabase
    .from('migration_routes')
    .select('id')
    .ilike('species', species);

  const typedRoutes = routes as Array<{ id: string }> | null;

  if (typedRoutes && typedRoutes.length > 0) {
    const routeIds = typedRoutes.map((r) => r.id);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('category', 'wildlife')
      .in('migration_route_id', routeIds)
      .order('name');

    const typedData = data as Event[] | null;
    if (!error && typedData && typedData.length > 0) {
      return typedData;
    }
  }

  // Fallback: text search in event names
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'wildlife')
    .ilike('name', `%${species}%`)
    .order('name');

  if (error) {
    console.error('getWildlifeBySpecies error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

/**
 * Fetch wildlife events by region and month.
 */
export async function getWildlifeByRegionMonth(
  region: string,
  month: number,
): Promise<Event[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'wildlife')
    .ilike('region', region)
    .lte('start_month', month)
    .gte('end_month', month)
    .order('name');

  if (error) {
    console.error('getWildlifeByRegionMonth error:', error);
    return [];
  }
  return (data as Event[]) ?? [];
}

// ---------------------------------------------------------------------------
// What-to-do queries
// ---------------------------------------------------------------------------

export interface WhatToDoData {
  events: Event[];
  destination: Destination | null;
  crowdScore: number | null;
  weatherSummary: string | null;
}

/**
 * Fetch events + destination data for a what-to-do page.
 * Returns events matching the destination region/country plus
 * crowd and weather data for the specific month.
 */
export async function getWhatToDoData(
  destinationSlug: string,
  month: number,
): Promise<WhatToDoData> {
  const supabase = createServerClient();

  // Fetch destination
  const { data: destinations } = await supabase
    .from('destinations')
    .select('*')
    .eq('slug', destinationSlug)
    .limit(1);

  const typedDestinations = destinations as Destination[] | null;
  const destination = typedDestinations?.[0] ?? null;

  if (!destination) {
    return { events: [], destination: null, crowdScore: null, weatherSummary: null };
  }

  // Fetch events matching this destination's region or country
  let events: Event[] = [];
  if (destination.region) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .ilike('region', destination.region)
      .lte('start_month', month)
      .gte('end_month', month)
      .order('name');
    events = (data as Event[]) ?? [];
  }

  if (events.length === 0 && destination.country) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .ilike('country', destination.country)
      .lte('start_month', month)
      .gte('end_month', month)
      .order('name');
    events = (data as Event[]) ?? [];
  }

  // Extract crowd and weather for the specific month
  const monthKey = String(month);
  const crowdScore = destination.crowd_data?.[monthKey] ?? null;

  const weather = destination.weather_data?.[monthKey] ?? null;
  let weatherSummary: string | null = null;
  if (weather) {
    weatherSummary = `${weather.temp_c}C, ${weather.rain_days} rain days, ${weather.sunshine_hours}h sunshine`;
  }

  return { events, destination, crowdScore, weatherSummary };
}

// ---------------------------------------------------------------------------
// Sitemap / distinct value queries
// ---------------------------------------------------------------------------

/**
 * Fetch distinct regions from events table.
 */
export async function getDistinctRegions(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('events')
    .select('region')
    .not('region', 'is', null);

  if (!data) return [];
  const typedData = data as Array<{ region: string | null }>;
  const regions = new Set(typedData.map((e) => e.region).filter(Boolean) as string[]);
  return Array.from(regions).sort();
}

/**
 * Fetch distinct countries from events table.
 */
export async function getDistinctCountries(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('events')
    .select('country')
    .not('country', 'is', null);

  if (!data) return [];
  const typedData = data as Array<{ country: string | null }>;
  const countries = new Set(typedData.map((e) => e.country).filter(Boolean) as string[]);
  return Array.from(countries).sort();
}

/**
 * Fetch distinct species from migration_routes table.
 */
export async function getDistinctSpecies(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('migration_routes')
    .select('species');

  if (!data) return [];
  const typedData = data as Array<{ species: string }>;
  const species = new Set(typedData.map((r) => r.species).filter(Boolean));
  return Array.from(species).sort();
}

/**
 * Fetch all destination slugs.
 */
export async function getAllDestinationSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('destinations').select('slug');
  const typedData = data as Array<{ slug: string }> | null;
  return (typedData ?? []).map((d) => d.slug);
}

/**
 * Fetch all event slugs for sitemap generation.
 */
export async function getAllEventSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('events').select('slug');
  const typedData = data as Array<{ slug: string }> | null;
  return (typedData ?? []).map((e) => e.slug);
}

/**
 * Fetch all wildlife/migration route slugs for sitemap generation.
 */
export async function getAllWildlifeSlugs(): Promise<string[]> {
  const supabase = createServerClient();
  const { data } = await supabase.from('migration_routes').select('slug');
  const typedData = data as Array<{ slug: string }> | null;
  return (typedData ?? []).map((r) => r.slug);
}
