import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cleanup
 *
 * Nightly cleanup job triggered by Vercel Cron. Handles:
 * 1. Archive past events (end_date < today)
 * 2. Confidence decay for unconfirmed scraped events
 * 3. Purge expired affiliate link cache (> 24 hours old)
 *
 * Protected by INGEST_SECRET env var.
 */

export async function GET(request: Request) {
  // Verify secret
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, unknown> = {};

  try {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const cacheExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Archive past events (end_date has passed)
    const { error: archiveError } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lt('end_date', now);

    results.archived = archiveError ? archiveError.message : 'done';

    // 2a. Events not confirmed in 90+ days → review_needed
    const { error: reviewError } = await supabase
      .from('events')
      .update({ status: 'review_needed' })
      .eq('status', 'active')
      .in('source', ['wikipedia', 'apify_tourism', 'apify_wildlife'])
      .lt('last_confirmed_at', ninetyDaysAgo);

    results.marked_review = reviewError ? reviewError.message : 'done';

    // 2b. Events not confirmed in 60-90 days → drop confidence by 0.2
    const { data: decayEvents } = await supabase
      .from('events')
      .select('id, confidence')
      .eq('status', 'active')
      .in('source', ['wikipedia', 'apify_tourism', 'apify_wildlife'])
      .lt('last_confirmed_at', sixtyDaysAgo)
      .gte('last_confirmed_at', ninetyDaysAgo)
      .gt('confidence', 0.2);

    let decayed = 0;
    if (decayEvents?.length) {
      for (const event of decayEvents) {
        const newConfidence = Math.max(0.1, ((event as { confidence: number }).confidence ?? 1.0) - 0.2);
        const { error } = await supabase
          .from('events')
          .update({ confidence: newConfidence })
          .eq('id', (event as { id: string }).id);
        if (!error) decayed++;
      }
    }
    results.confidence_decay = decayed;

    // 3. Purge expired affiliate link cache (> 24 hours old)
    const { error: purgeError } = await supabase
      .from('affiliate_links')
      .delete()
      .lt('created_at', cacheExpiry);

    results.affiliate_cache_purged = purgeError ? purgeError.message : 'done';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error('[cleanup] Fatal error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
