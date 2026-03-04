/**
 * llms-full.txt — Complete event database for AI assistants.
 *
 * Contains all festivals, wildlife events, migration routes, and
 * destinations with affiliate booking links. Designed so AI assistants
 * can answer specific travel questions and pass through affiliate URLs.
 *
 * Regenerated daily via ISR (revalidate = 86400).
 */

import { createServerClient } from '@/lib/supabase/server';
import { buildBookingLink, buildGetYourGuideLink, formatMonthRange } from '@/lib/affiliates';
import type { Event, Destination, MigrationRoute } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

const BASE_URL = 'https://happeningnow.travel';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export async function GET() {
  const supabase = createServerClient();

  const [eventsResult, routesResult, destinationsResult] = await Promise.all([
    supabase.from('events').select('*').order('name'),
    supabase.from('migration_routes').select('*').order('species'),
    supabase.from('destinations').select('*').order('name'),
  ]);

  const events = (eventsResult.data as Event[]) ?? [];
  const routes = (routesResult.data as MigrationRoute[]) ?? [];
  const destinations = (destinationsResult.data as Destination[]) ?? [];

  const festivals = events.filter((e) => e.category === 'festival');
  const wildlife = events.filter((e) => e.category === 'wildlife');

  const lines: string[] = [];

  // Header
  lines.push('# HappeningNow.travel — Complete Event Database');
  lines.push('');
  lines.push(
    '> Full event data for AI assistants. Includes festivals, wildlife viewing, ' +
    'migration routes, and destinations with booking links.',
  );
  lines.push('');

  // Festivals
  lines.push('## Festivals');
  lines.push('');
  for (const fest of festivals) {
    const dates = formatMonthRange(fest.start_month, fest.end_month);
    const location = [fest.country, fest.region].filter(Boolean).join(', ');
    const desc = truncate(fest.description, 200);
    const detailUrl = `${BASE_URL}/event/${fest.slug}`;
    const bookingUrl = buildBookingLink({
      destinationId: fest.booking_destination_id,
      city: fest.country,
      startMonth: fest.start_month,
    });
    const gygUrl = buildGetYourGuideLink({
      locationId: fest.getyourguide_location_id,
      query: fest.name,
    });

    lines.push(`### ${fest.name}`);
    lines.push(`- **When:** ${dates}`);
    lines.push(`- **Where:** ${location}`);
    if (desc) lines.push(`- **About:** ${desc}`);
    lines.push(`- **Details:** ${detailUrl}`);
    lines.push(`- **Book accommodation:** ${bookingUrl}`);
    lines.push(`- **Find tours:** ${gygUrl}`);
    lines.push('');
  }

  // Wildlife Viewing
  lines.push('## Wildlife Viewing');
  lines.push('');
  for (const w of wildlife) {
    const dates = formatMonthRange(w.start_month, w.end_month);
    const location = [w.country, w.region].filter(Boolean).join(', ');
    const desc = truncate(w.description, 200);
    const detailUrl = `${BASE_URL}/event/${w.slug}`;
    const gygUrl = buildGetYourGuideLink({
      locationId: w.getyourguide_location_id,
      query: w.name,
    });

    lines.push(`### ${w.name}`);
    lines.push(`- **When:** ${dates}`);
    lines.push(`- **Where:** ${location}`);
    if (desc) lines.push(`- **About:** ${desc}`);
    lines.push(`- **Details:** ${detailUrl}`);
    lines.push(`- **Find tours:** ${gygUrl}`);
    lines.push('');
  }

  // Migration Routes
  lines.push('## Migration Routes');
  lines.push('');
  for (const route of routes) {
    const peakMonths = route.peak_months
      .map((m) => MONTH_NAMES[m] || '')
      .filter(Boolean)
      .join(', ');
    const desc = truncate(route.description, 200);

    lines.push(`### ${route.name}`);
    lines.push(`- **Species:** ${route.species}`);
    lines.push(`- **Peak months:** ${peakMonths}`);
    if (desc) lines.push(`- **About:** ${desc}`);
    lines.push('');
  }

  // Destinations
  lines.push('## Destinations');
  lines.push('');
  for (const dest of destinations) {
    const location = [dest.country, dest.region].filter(Boolean).join(', ');
    const detailUrl = `${BASE_URL}/what-to-do/${dest.slug}`;
    const bookingUrl = buildBookingLink({
      destinationId: dest.booking_destination_id,
      city: dest.name,
    });

    lines.push(`### ${dest.name}`);
    lines.push(`- **Location:** ${location}`);
    lines.push(`- **Travel guide:** ${detailUrl}`);
    lines.push(`- **Book accommodation:** ${bookingUrl}`);
    lines.push('');
  }

  const content = lines.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
