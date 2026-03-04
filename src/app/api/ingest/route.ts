import { NextResponse } from 'next/server';
import { normaliseAndUpsert } from '@/lib/ingest/normalise';
import { fetchTicketmasterEvents } from '@/lib/ingest/sources/ticketmaster';
import { fetchWikipediaEvents } from '@/lib/ingest/sources/wikipedia';

/**
 * POST /api/ingest
 *
 * Runs the data ingestion pipeline. Triggered by:
 * - Vercel Cron (daily)
 * - Manual trigger for debugging
 *
 * Protected by INGEST_SECRET env var in the Authorization header.
 *
 * Query params:
 * - source: 'ticketmaster' | 'wikipedia' | 'all' (default: 'all')
 */
export async function POST(request: Request) {
  // Verify secret
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const sourceFilter = searchParams.get('source') || 'all';

  const results: Record<string, unknown> = {};
  const allErrors: string[] = [];

  try {
    // Ticketmaster
    if (sourceFilter === 'all' || sourceFilter === 'ticketmaster') {
      const tmKey = process.env.TICKETMASTER_API_KEY;
      if (tmKey) {
        console.log('[ingest] Fetching Ticketmaster events...');
        const tmResult = await fetchTicketmasterEvents(tmKey);
        results.ticketmaster_fetched = tmResult.events.length;
        allErrors.push(...tmResult.errors);

        if (tmResult.events.length > 0) {
          const normalised = await normaliseAndUpsert(tmResult.events);
          results.ticketmaster = normalised;
        }
      } else {
        results.ticketmaster = 'skipped (no TICKETMASTER_API_KEY)';
      }
    }

    // Wikipedia
    if (sourceFilter === 'all' || sourceFilter === 'wikipedia') {
      console.log('[ingest] Fetching Wikipedia events...');
      const wikiResult = await fetchWikipediaEvents();
      results.wikipedia_fetched = wikiResult.events.length;
      allErrors.push(...wikiResult.errors);

      if (wikiResult.events.length > 0) {
        const normalised = await normaliseAndUpsert(wikiResult.events);
        results.wikipedia = normalised;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      errors: allErrors.length > 0 ? allErrors.slice(0, 50) : undefined,
    });
  } catch (err) {
    console.error('[ingest] Fatal error:', err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ingest — Vercel Cron hits GET by default.
 * Delegates to POST logic.
 */
export async function GET(request: Request) {
  return POST(request);
}
