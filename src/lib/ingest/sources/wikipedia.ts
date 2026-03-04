/**
 * Wikipedia festival source adapter.
 *
 * Scrapes curated Wikipedia festival list pages, extracts event names
 * and locations. Geocoding is handled by the shared normaliser.
 *
 * Refactored from scripts/scrape-wikipedia.ts to output RawEvent[].
 */

import * as cheerio from 'cheerio';
import type { RawEvent, SourceResult } from '../types';

const USER_AGENT = 'HappeningNow.travel/1.0 ingest-pipeline (contact: admin@happeningnow.travel)';

interface PageConfig {
  page: string;
  nameCol: number;
  locationCol: number;
  countryCol: number | null;
}

const PAGES: PageConfig[] = [
  {
    page: 'List_of_jazz_festivals',
    nameCol: 0,
    locationCol: 2,
    countryCol: null,
  },
  {
    page: 'List_of_film_festivals',
    nameCol: 0,
    locationCol: 2,
    countryCol: 3,
  },
  {
    page: 'List_of_film_festivals_in_Europe',
    nameCol: 0,
    locationCol: 2,
    countryCol: null,
  },
];

function cleanText(text: string): string {
  return text.replace(/\[[\d\w]+\]/g, '').trim();
}

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

function parseTable(html: string, config: PageConfig): Array<{ name: string; location: string; country: string | null }> {
  const $ = cheerio.load(html);
  const rows: Array<{ name: string; location: string; country: string | null }> = [];

  $('table.wikitable tr').each((_i, tr) => {
    const cells = $(tr).find('td');
    if (cells.length === 0) return;

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

export async function fetchWikipediaEvents(): Promise<SourceResult> {
  const events: RawEvent[] = [];
  const errors: string[] = [];

  for (const config of PAGES) {
    let html: string;
    try {
      html = await fetchWikipediaHtml(config.page);
    } catch (err) {
      errors.push(`Failed to fetch ${config.page}: ${(err as Error).message}`);
      continue;
    }

    const rows = parseTable(html, config);

    for (const row of rows) {
      events.push({
        name: row.name,
        description: null,
        image_url: null,
        category: 'festival',
        start_date: null,
        end_date: null,
        start_month: null,
        end_month: null,
        lat: null,
        lng: null,
        location_name: row.location,
        country: row.country,
        region: row.location,
        scale: 5,
        crowd_level: null,
        source: 'wikipedia',
        source_id: null,
        confidence: 0.7,
        venue_name: null,
        source_url: `https://en.wikipedia.org/wiki/${config.page}`,
        booking_destination_id: null,
        getyourguide_location_id: null,
      });
    }
  }

  console.log(`[wikipedia] Parsed ${events.length} events from ${PAGES.length} pages`);
  return { source: 'wikipedia', events, errors };
}
