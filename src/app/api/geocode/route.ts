import { NextResponse } from 'next/server';

const PHOTON_BASE = 'https://photon.komoot.io/api/';
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * GET /api/geocode?q=london
 *
 * Proxies location autocomplete requests to Photon (komoot).
 * Returns GeoJSON FeatureCollection with location suggestions.
 * Uses Photon (NOT Nominatim) because Nominatim forbids autocomplete usage.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ features: [] });
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const url = new URL(PHOTON_BASE);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('layer', 'city,state,country');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'HappeningNow.travel/1.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ features: [] }, { status: 502 });
    }

    const data = await res.json();
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ features: [] }, { status: 502 });
  }
}
