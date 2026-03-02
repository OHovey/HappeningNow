/**
 * Wikipedia festival seed data scraping script.
 *
 * One-time/manually-triggered script that scrapes curated Wikipedia
 * festival list pages, geocodes locations via Nominatim, and outputs
 * JSON matching the events table schema.
 *
 * Usage:
 *   npm run scrape-wikipedia            # Scrape and write JSON
 *   npm run scrape-wikipedia -- --dry-run # Parse and geocode without writing
 *
 * Respects Nominatim usage policy: 1 second delay between requests.
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrapedEvent {
  name: string;
  slug: string;
  category: 'festival';
  description: null;
  image_url: null;
  start_month: null;
  end_month: null;
  lng: number;
  lat: number;
  country: string | null;
  region: string | null;
  scale: number;
  crowd_level: null;
}

interface PageConfig {
  page: string;
  // Column indexes for table parsing (0-based)
  nameCol: number;
  locationCol: number;
  countryCol: number | null; // null if country is in location string
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const USER_AGENT = 'HappeningNow.travel/1.0 seed-script (contact: admin@happeningnow.travel)';

const PAGES: PageConfig[] = [
  {
    page: 'List_of_jazz_festivals',
    nameCol: 0,
    locationCol: 2, // Name, Year, Location, Notes, Image
    countryCol: null,
  },
  {
    page: 'List_of_film_festivals',
    nameCol: 0,
    locationCol: 2, // Name, Est., Location, Country, Type, Notes
    countryCol: 3,
  },
  {
    page: 'List_of_film_festivals_in_Europe',
    nameCol: 0,
    locationCol: 2, // Name, Est., Location, Type, Details
    countryCol: null,
  },
];

const OUTPUT_PATH = resolve(__dirname, '..', 'src/data/seed/wikipedia-festivals.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanText(text: string): string {
  // Remove citation brackets like [1], [2], etc.
  return text.replace(/\[[\d\w]+\]/g, '').trim();
}

// ---------------------------------------------------------------------------
// MediaWiki API
// ---------------------------------------------------------------------------

async function fetchWikipediaHtml(page: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`MediaWiki API error for ${page}: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`MediaWiki API error: ${data.error.info}`);
  }

  return data.parse.text['*'];
}

// ---------------------------------------------------------------------------
// Table parsing
// ---------------------------------------------------------------------------

function parseTable(html: string, config: PageConfig): Array<{ name: string; location: string; country: string | null }> {
  const $ = cheerio.load(html);
  const rows: Array<{ name: string; location: string; country: string | null }> = [];

  $('table.wikitable tr').each((_i, tr) => {
    const cells = $(tr).find('td');
    if (cells.length === 0) return; // Skip header rows

    const name = cleanText($(cells[config.nameCol]).text());
    const location = cleanText($(cells[config.locationCol]).text());
    const country = config.countryCol !== null
      ? cleanText($(cells[config.countryCol]).text())
      : null;

    if (name && location) {
      rows.push({ name, location, country });
    }
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Nominatim geocoding
// ---------------------------------------------------------------------------

async function geocode(
  location: string,
  country: string | null,
): Promise<{ lat: number; lng: number } | null> {
  const query = country ? `${location}, ${country}` : location;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  if (dryRun) {
    console.log('--- DRY RUN MODE ---\n');
  }

  const allEvents: ScrapedEvent[] = [];

  for (const config of PAGES) {
    console.log(`Scraping ${config.page}...`);

    let html: string;
    try {
      html = await fetchWikipediaHtml(config.page);
    } catch (err) {
      console.warn(`  Failed to fetch ${config.page}: ${(err as Error).message}. Skipping.`);
      continue;
    }

    const rows = parseTable(html, config);
    console.log(`  Found ${rows.length} rows.`);

    let geocoded = 0;
    for (const row of rows) {
      // 1 second delay between Nominatim requests
      await sleep(1000);

      const coords = await geocode(row.location, row.country);
      if (!coords) {
        console.warn(`  [skip] Could not geocode: ${row.name} (${row.location})`);
        continue;
      }

      geocoded++;
      allEvents.push({
        name: row.name,
        slug: slugify(row.name),
        category: 'festival',
        description: null,
        image_url: null,
        start_month: null,
        end_month: null,
        lng: coords.lng,
        lat: coords.lat,
        country: row.country,
        region: row.location,
        scale: 5,
        crowd_level: null,
      });
    }

    console.log(`  Geocoded ${geocoded}/${rows.length}.`);
  }

  console.log(`\nTotal events: ${allEvents.length}`);

  if (dryRun) {
    console.log('\nDry run complete. Sample output:');
    console.log(JSON.stringify(allEvents.slice(0, 3), null, 2));
    return;
  }

  // Write output
  const dir = dirname(OUTPUT_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(allEvents, null, 2), 'utf-8');
  console.log(`\nWrote ${allEvents.length} events to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
