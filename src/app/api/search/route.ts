import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

/**
 * Zod schema for search query parameters.
 * Exported for testability.
 */
export const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1000).max(1000000).default(200000),
  start_month: z.coerce.number().int().min(1).max(12).optional(),
  end_month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.enum(['festival', 'concert', 'sport', 'arts', 'event', 'wildlife']).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * GET /api/search?lat=51.5&lng=-0.1&radius=200000&start_month=3&end_month=6&category=festival
 *
 * Returns events within radius of coordinates, optionally filtered by
 * date range (month overlap) and category. Results include distance_meters.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { lat, lng, radius, start_month, end_month, category } = parsed.data;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.rpc('search_events_nearby', {
    user_lat: lat,
    user_lng: lng,
    radius_meters: radius,
    start_m: start_month ?? null,
    end_m: end_month ?? null,
    filter_category: category ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
