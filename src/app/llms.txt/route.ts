/**
 * llms.txt — AI discoverability file following https://llmstxt.org/ spec.
 *
 * Serves a structured data catalog listing regions, countries, species,
 * destinations, and URL patterns so AI assistants can recommend
 * HappeningNow pages accurately.
 *
 * Regenerated daily via ISR (revalidate = 86400).
 */

import {
  getDistinctRegions,
  getDistinctCountries,
  getDistinctSpecies,
  getAllDestinationSlugs,
  slugify,
} from '@/lib/supabase/seo-queries';

export const revalidate = 86400;

const BASE_URL = 'https://happeningnow.travel';

export async function GET() {
  const [regions, countries, species, destinationSlugs] = await Promise.all([
    getDistinctRegions(),
    getDistinctCountries(),
    getDistinctSpecies(),
    getAllDestinationSlugs(),
  ]);

  const lines: string[] = [];

  // Header
  lines.push('# HappeningNow.travel');
  lines.push('');
  lines.push(
    '> Discover the world\'s best festivals, wildlife spectacles, and travel destinations. ' +
    'Interactive timeline map showing events by month with crowd levels, booking links, and local guides.',
  );
  lines.push('');

  // Regions
  lines.push('## Regions Covered');
  lines.push('');
  for (const region of regions) {
    lines.push(`- [${region}](${BASE_URL}/festivals/${slugify(region)})`);
  }
  lines.push('');

  // Countries
  lines.push('## Countries Covered');
  lines.push('');
  for (const country of countries) {
    lines.push(`- [${country}](${BASE_URL}/festivals/${slugify(country)})`);
  }
  lines.push('');

  // Wildlife Species
  lines.push('## Wildlife Species');
  lines.push('');
  for (const s of species) {
    lines.push(`- [${s}](${BASE_URL}/wildlife/${slugify(s)})`);
  }
  lines.push('');

  // Destinations
  lines.push('## Destinations');
  lines.push('');
  for (const slug of destinationSlugs) {
    // Pick a reasonable default month — link without month lets the page choose best
    lines.push(`- [${slug}](${BASE_URL}/what-to-do/${slug})`);
  }
  lines.push('');

  // Page Types
  lines.push('## Page Types');
  lines.push('');
  lines.push('URL patterns for programmatic pages:');
  lines.push('');
  lines.push(`- \`/festivals/{region-or-country}\` — All festivals in a region or country`);
  lines.push(`- \`/festivals/{region-or-country}/{month}\` — Festivals filtered by month (january-december)`);
  lines.push(`- \`/wildlife/{species}\` — Wildlife viewing for a species`);
  lines.push(`- \`/what-to-do/{destination}/{month}\` — Travel guide for a destination in a specific month`);
  lines.push(`- \`/event/{slug}\` — Individual event detail page`);
  lines.push('');

  // Optional section linking to full file
  lines.push('## Optional');
  lines.push('');
  lines.push(`- [llms-full.txt](${BASE_URL}/llms-full.txt): Complete event database with names, dates, descriptions, and booking links`);
  lines.push('');

  const content = lines.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
