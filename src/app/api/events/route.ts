import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

/**
 * Zod schema for bbox event query parameters.
 * Exported for testability.
 */
export const bboxQuerySchema = z.object({
  bbox: z.string().transform((s, ctx) => {
    const parts = s.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'bbox must be 4 comma-separated numbers: min_lng,min_lat,max_lng,max_lat',
      });
      return z.NEVER;
    }
    return {
      min_lng: parts[0],
      min_lat: parts[1],
      max_lng: parts[2],
      max_lat: parts[3],
    };
  }),
  month: z.coerce.number().int().min(1).max(12).optional(),
  category: z.enum(['festival', 'wildlife']).optional(),
});

export type BboxQuery = z.infer<typeof bboxQuerySchema>;

/**
 * GET /api/events?bbox=min_lng,min_lat,max_lng,max_lat&month=3&category=festival
 *
 * Returns GeoJSON FeatureCollection of events within the bounding box,
 * optionally filtered by month and category.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = bboxQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bbox, month, category } = parsed.data;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.rpc('get_events_bbox', {
    min_lng: bbox.min_lng,
    min_lat: bbox.min_lat,
    max_lng: bbox.max_lng,
    max_lat: bbox.max_lat,
    filter_month: month ?? null,
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
