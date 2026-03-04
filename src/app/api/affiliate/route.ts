import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/affiliate?destination_id=xxx&date_start=2026-03-15&date_end=2026-03-22&city=Barcelona
 *
 * Returns cached or freshly generated affiliate links for a destination.
 * Uses Travelpayouts Partner Links API when TRAVELPAYOUTS_API_TOKEN is set,
 * otherwise returns direct (non-affiliate) links as a mock fallback.
 */

const querySchema = z.object({
  destination_id: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
});

interface AffiliateResult {
  brand: string;
  label: string;
  url: string;
  type: 'accommodation' | 'tours' | 'tickets';
}

const BRANDS: Array<{
  brand: string;
  label: string;
  type: AffiliateResult['type'];
  buildUrl: (city: string, dateStart?: string, dateEnd?: string) => string;
}> = [
  {
    brand: 'booking',
    label: 'Book a stay',
    type: 'accommodation',
    buildUrl: (city, dateStart, dateEnd) => {
      const params = new URLSearchParams({ ss: city });
      if (dateStart) params.set('checkin', dateStart);
      if (dateEnd) params.set('checkout', dateEnd);
      params.set('no_rooms', '1');
      params.set('group_adults', '2');
      const aid = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;
      if (aid) params.set('aid', aid);
      return `https://www.booking.com/searchresults.html?${params}`;
    },
  },
  {
    brand: 'viator',
    label: 'Find experiences',
    type: 'tours',
    buildUrl: (city) => {
      const params = new URLSearchParams({ q: city });
      return `https://www.viator.com/search/${encodeURIComponent(city)}?${params}`;
    },
  },
  {
    brand: 'getyourguide',
    label: 'Find tours',
    type: 'tours',
    buildUrl: (city) => {
      const params = new URLSearchParams({ q: city });
      const partnerId = process.env.NEXT_PUBLIC_GYG_PARTNER_ID;
      if (partnerId) params.set('partner_id', partnerId);
      return `https://www.getyourguide.com/s/?${params}`;
    },
  },
  {
    brand: 'tiqets',
    label: 'Get tickets',
    type: 'tickets',
    buildUrl: (city) => {
      return `https://www.tiqets.com/en/search?q=${encodeURIComponent(city)}`;
    },
  },
];

/** Cache TTL: 24 hours */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getCachedLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  destinationId: string,
  dateStart: string | null,
  dateEnd: string | null,
): Promise<AffiliateResult[] | null> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

  const query = supabase
    .from('affiliate_links')
    .select('brand, affiliate_url, original_url')
    .eq('destination_id', destinationId)
    .gt('created_at', cutoff);

  if (dateStart) query.eq('date_start', dateStart);
  if (dateEnd) query.eq('date_end', dateEnd);

  const { data } = await query;

  if (!data?.length || data.length < BRANDS.length) return null;

  return data.map((row: { brand: string; affiliate_url: string; original_url: string }) => {
    const brandConfig = BRANDS.find((b) => b.brand === row.brand);
    return {
      brand: row.brand,
      label: brandConfig?.label || row.brand,
      url: row.affiliate_url,
      type: brandConfig?.type || ('tours' as const),
    };
  });
}

async function cacheLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  destinationId: string,
  dateStart: string | null,
  dateEnd: string | null,
  links: Array<{ brand: string; originalUrl: string; affiliateUrl: string }>,
) {
  const rows = links.map((link) => ({
    destination_id: destinationId,
    brand: link.brand,
    date_start: dateStart,
    date_end: dateEnd,
    original_url: link.originalUrl,
    affiliate_url: link.affiliateUrl,
  }));

  await supabase.from('affiliate_links').insert(rows);
}

/**
 * Call Travelpayouts Partner Links API to convert raw URLs to affiliate URLs.
 * Falls back to raw URLs if the API token is missing or the call fails.
 */
async function generateAffiliateUrls(
  urls: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const token = process.env.TRAVELPAYOUTS_API_TOKEN;

  if (!token) {
    // Mock mode: return original URLs unchanged
    for (const url of urls) result.set(url, url);
    return result;
  }

  try {
    // Travelpayouts Partner Links API: batch up to 10 URLs
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += 10) {
      batches.push(urls.slice(i, i + 10));
    }

    for (const batch of batches) {
      const res = await fetch('https://www.travelpayouts.com/api/v2/affiliate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ urls: batch }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.links) {
          for (const link of data.links) {
            result.set(link.original_url, link.affiliate_url);
          }
        }
      }
    }
  } catch (err) {
    console.error('[affiliate] Travelpayouts API error:', err);
  }

  // Fill in any missing URLs with originals
  for (const url of urls) {
    if (!result.has(url)) result.set(url, url);
  }

  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { destination_id, city, country, date_start, date_end } = parsed.data;
  const cityName = city || country || 'destination';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check cache first
  const cached = await getCachedLinks(supabase, destination_id, date_start || null, date_end || null);
  if (cached) {
    return NextResponse.json({ links: cached, cached: true }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  }

  // Generate raw URLs for each brand
  const rawUrls = BRANDS.map((b) => ({
    brand: b.brand,
    label: b.label,
    type: b.type,
    url: b.buildUrl(cityName, date_start, date_end),
  }));

  // Convert to affiliate URLs
  const urlMap = await generateAffiliateUrls(rawUrls.map((r) => r.url));

  const links: AffiliateResult[] = rawUrls.map((r) => ({
    brand: r.brand,
    label: r.label,
    type: r.type,
    url: urlMap.get(r.url) || r.url,
  }));

  // Cache the results
  await cacheLinks(
    supabase,
    destination_id,
    date_start || null,
    date_end || null,
    rawUrls.map((r) => ({
      brand: r.brand,
      originalUrl: r.url,
      affiliateUrl: urlMap.get(r.url) || r.url,
    })),
  );

  return NextResponse.json({ links, cached: false }, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
  });
}
