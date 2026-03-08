/**
 * Fetch geotagged Wikimedia Commons image counts on a global adaptive grid
 * to build a crowd density heatmap.
 *
 * Uses the MediaWiki geosearch API (no API key required):
 *   - generator=geosearch returns up to 500 geotagged images per coordinate
 *   - prop=imageinfo gives upload timestamps for seasonal bucketing
 *
 * Approach:
 *   Phase 1 — Coarse scan (2° grid, offset by 0.5° to hit city centres):
 *             one API call per cell. Filters out ocean/desert.
 *   Phase 2 — Adaptive refinement: subdivide high-density cells into 1°
 *             sub-cells for finer heatmap resolution in tourist hotspots.
 *
 * Normalisation is GLOBAL (not per-cell) so absolute density drives the
 * heatmap — Paris glows hotter than a village.
 *
 * Progress is saved to a cache file — safe to interrupt and resume.
 *
 * Usage:
 *   npx tsx scripts/fetch-crowd-density.ts              # Run (resumable)
 *   npx tsx scripts/fetch-crowd-density.ts --dry-run     # Scan only, no output
 *   npx tsx scripts/fetch-crowd-density.ts --reset       # Delete cache, start fresh
 *   npx tsx scripts/fetch-crowd-density.ts --help
 *
 * Output: src/data/crowd-grid.json
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONCURRENCY = 10;
const DELAY_MS = 100;
const MAX_RETRIES = 3;
const GS_RADIUS = 10000; // metres (API max)
const GS_LIMIT = 500; // results per query (API max)

// Grid bounds (skip Antarctica and deep Arctic)
const LAT_MIN = -50;
const LAT_MAX = 68;
const LON_MIN = -180;
const LON_MAX = 180;
const COARSE_STEP = 2;
const FINE_STEP = 1;
// Offset grid by half a degree so points land nearer to city centres
// (most major cities are at .5 offsets: London 51.5, Paris 48.9, Berlin 52.5, etc.)
const GRID_OFFSET = 0.5;

// Thresholds
const ACTIVE_MIN = 50; // minimum images for meaningful seasonal signal
const SUBDIVIDE_THRESHOLD = 300; // images to trigger subdivision
const MIN_MONTHLY_SPREAD = 4; // require images in at least N months

const USER_AGENT = "HappeningNow/1.0 (travel heatmap; crowd density research)";
const CACHE_PATH = join(__dirname, ".crowd-density-cache.json");
const OUTPUT_PATH = join(__dirname, "..", "src", "data", "crowd-grid.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CellResult {
  count: number;
  monthly: Record<string, number>; // {"1": count, "2": count, ...}
}

interface CacheData {
  version: number; // bump to invalidate old caches
  coarseComplete: boolean;
  cells: Record<string, CellResult>; // "lat,lon" -> result
  refinedCells: string[]; // coarse cells already subdivided
}

const CACHE_VERSION = 2;

// ---------------------------------------------------------------------------
// Wikimedia Commons API
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchGeoImages(
  lat: number,
  lon: number,
): Promise<CellResult> {
  const params = new URLSearchParams({
    action: "query",
    generator: "geosearch",
    ggscoord: `${lat}|${lon}`,
    ggsradius: String(GS_RADIUS),
    ggslimit: String(GS_LIMIT),
    ggsnamespace: "6", // File namespace only
    prop: "imageinfo",
    iiprop: "timestamp",
    format: "json",
    formatversion: "2",
  });

  const url = `https://commons.wikimedia.org/w/api.php?${params}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) {
        if (res.status === 429) {
          await sleep(3000 * (attempt + 1));
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const pages = data.query?.pages ?? [];

      // Bucket timestamps by month
      const monthly: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) monthly[String(m)] = 0;

      for (const page of pages) {
        const ts = page.imageinfo?.[0]?.timestamp;
        if (ts) {
          const month = new Date(ts).getMonth() + 1;
          monthly[String(month)]++;
        }
      }

      return { count: pages.length, monthly };
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) {
        return { count: -1, monthly: {} };
      }
      await sleep(1000 * (attempt + 1));
    }
  }

  return { count: -1, monthly: {} };
}

// ---------------------------------------------------------------------------
// Grid generation
// ---------------------------------------------------------------------------

interface CellKey {
  lat: number;
  lon: number;
}

function generateGrid(
  step: number,
  latMin = LAT_MIN,
  latMax = LAT_MAX,
  lonMin = LON_MIN,
  lonMax = LON_MAX,
  offset = 0,
): CellKey[] {
  const cells: CellKey[] = [];
  for (let lat = latMin + offset; lat <= latMax; lat += step) {
    for (let lon = lonMin + offset; lon < lonMax; lon += step) {
      cells.push({
        lat: Math.round(lat * 10) / 10,
        lon: Math.round(lon * 10) / 10,
      });
    }
  }
  return cells;
}

function key(lat: number, lon: number): string {
  return `${lat},${lon}`;
}

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

function loadCache(): CacheData {
  if (existsSync(CACHE_PATH)) {
    const cached = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
    if (cached.version === CACHE_VERSION) return cached;
    console.log("Cache version mismatch — starting fresh.\n");
  }
  return {
    version: CACHE_VERSION,
    coarseComplete: false,
    cells: {},
    refinedCells: [],
  };
}

function saveCache(cache: CacheData): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

// ---------------------------------------------------------------------------
// Phase 1: Coarse scan
// ---------------------------------------------------------------------------

async function coarseScan(cache: CacheData): Promise<void> {
  if (cache.coarseComplete) {
    const active = Object.values(cache.cells).filter(
      (c) => c.count >= ACTIVE_MIN,
    ).length;
    console.log(
      `Coarse scan already complete. ${active} active cells cached.\n`,
    );
    return;
  }

  const grid = generateGrid(COARSE_STEP, undefined, undefined, undefined, undefined, GRID_OFFSET);
  const remaining = grid.filter(
    (c) => !(key(c.lat, c.lon) in cache.cells),
  );

  console.log(
    `Phase 1: Scanning ${grid.length} coarse cells (${remaining.length} remaining)...`,
  );

  let done = grid.length - remaining.length;

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((c) => fetchGeoImages(c.lat, c.lon)),
    );

    for (let j = 0; j < batch.length; j++) {
      if (results[j].count >= 0) {
        cache.cells[key(batch[j].lat, batch[j].lon)] = results[j];
      }
    }

    done += batch.length;
    if (done % 50 === 0 || i + CONCURRENCY >= remaining.length) {
      const active = Object.values(cache.cells).filter(
        (c) => c.count >= ACTIVE_MIN,
      ).length;
      process.stdout.write(
        `\r  ${done}/${grid.length} scanned, ${active} active`,
      );
      saveCache(cache);
    }

    await sleep(DELAY_MS);
  }

  cache.coarseComplete = true;
  saveCache(cache);

  const active = Object.values(cache.cells).filter(
    (c) => c.count >= ACTIVE_MIN,
  ).length;
  console.log(
    `\n  Done. ${active} cells have >= ${ACTIVE_MIN} images.\n`,
  );
}

// ---------------------------------------------------------------------------
// Phase 2: Adaptive refinement
// ---------------------------------------------------------------------------

async function refinePhase(cache: CacheData): Promise<void> {
  const toRefine = Object.entries(cache.cells)
    .filter(
      ([k, cell]) =>
        cell.count >= SUBDIVIDE_THRESHOLD &&
        !cache.refinedCells.includes(k),
    )
    .map(([k]) => {
      const [lat, lon] = k.split(",").map(Number);
      return { lat, lon, key: k };
    });

  if (toRefine.length === 0) {
    console.log("Phase 2: No cells need refinement.\n");
    return;
  }

  console.log(
    `Phase 2: Subdividing ${toRefine.length} high-density cells into ${FINE_STEP} sub-cells...`,
  );

  let totalSubCells = 0;

  for (const parent of toRefine) {
    const subCells = generateGrid(
      FINE_STEP,
      parent.lat,
      parent.lat + COARSE_STEP - FINE_STEP,
      parent.lon,
      parent.lon + COARSE_STEP - FINE_STEP,
      0,
    ).filter((c) => !(key(c.lat, c.lon) in cache.cells));

    for (let i = 0; i < subCells.length; i += CONCURRENCY) {
      const batch = subCells.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((c) => fetchGeoImages(c.lat, c.lon)),
      );

      for (let j = 0; j < batch.length; j++) {
        if (results[j].count >= 0) {
          cache.cells[key(batch[j].lat, batch[j].lon)] = results[j];
          totalSubCells++;
        }
      }

      await sleep(DELAY_MS);
    }

    // Remove the coarse parent — replaced by finer cells
    delete cache.cells[parent.key];
    cache.refinedCells.push(parent.key);
    saveCache(cache);
    process.stdout.write(
      `\r  Refined ${cache.refinedCells.length}/${toRefine.length} parents (${totalSubCells} sub-cells)`,
    );
  }

  console.log(`\n  Done.\n`);
}

// ---------------------------------------------------------------------------
// Normalisation + output
//
// GLOBAL normalisation: the heatmap weight reflects absolute photo density,
// so Paris/London glow hotter than a village. Seasonal variation is encoded
// as a per-cell ratio relative to that cell's annual mean.
// ---------------------------------------------------------------------------

function buildOutput(cache: CacheData): void {
  const activeCells = Object.entries(cache.cells).filter(([, cell]) => {
    if (cell.count < ACTIVE_MIN) return false;
    const monthsWithData = Object.values(cell.monthly).filter(
      (c) => c > 0,
    ).length;
    return monthsWithData >= MIN_MONTHLY_SPREAD;
  });

  if (activeCells.length === 0) {
    console.log("No active cells to output.");
    return;
  }

  // Find global max count for absolute weight scaling
  const globalMax = Math.max(
    ...activeCells.map(([, cell]) => cell.count),
  );

  const grid: {
    lat: number;
    lon: number;
    weight: number; // 0-1 global density (drives heatmap intensity)
    scores: Record<string, number>; // 1-10 per-cell seasonal variation
  }[] = [];

  for (const [k, cell] of activeCells) {
    const [lat, lon] = k.split(",").map(Number);

    // Global weight: how dense is this cell compared to the busiest cell
    const weight = Math.round((cell.count / globalMax) * 100) / 100;

    // Per-cell seasonal scores (relative variation within this cell)
    const values = Object.values(cell.monthly);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const scores: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      if (max === min) {
        scores[String(m)] = 5;
      } else {
        scores[String(m)] = Math.round(
          1 + ((cell.monthly[String(m)] - min) / (max - min)) * 9,
        );
      }
    }

    grid.push({ lat, lon, weight, scores });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(grid) + "\n");
  console.log(`Wrote ${grid.length} grid cells to ${OUTPUT_PATH}`);
  console.log(
    `Global max: ${globalMax} images. Weight range: ${Math.min(...grid.map((g) => g.weight))}-${Math.max(...grid.map((g) => g.weight))}`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const reset = args.includes("--reset");
  const help = args.includes("--help");

  if (help) {
    console.log(
      "Usage: npx tsx scripts/fetch-crowd-density.ts [--dry-run] [--reset] [--help]",
    );
    console.log(
      "\nFetches geotagged Wikimedia Commons image counts on a global adaptive grid.",
    );
    console.log(
      "No API key required. Progress is cached — safe to interrupt and resume.",
    );
    console.log(
      "\n  --dry-run   Scan only, print top cells, don't write output",
    );
    console.log("  --reset     Delete cache and start fresh");
    process.exit(0);
  }

  if (reset && existsSync(CACHE_PATH)) {
    unlinkSync(CACHE_PATH);
    console.log("Cache cleared.\n");
  }

  const cache = loadCache();

  console.log("=== Wikimedia Commons Global Crowd Density ===\n");

  // Phase 1: Coarse scan
  await coarseScan(cache);

  if (dryRun) {
    const active = Object.entries(cache.cells)
      .filter(([, c]) => c.count >= ACTIVE_MIN)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 20);
    console.log("Top 20 cells by image count:");
    for (const [k, cell] of active) {
      console.log(`  ${k}: ${cell.count} images`);
    }
    console.log("\n(Dry run — skipping refinement and output)");
    return;
  }

  // Phase 2: Adaptive refinement
  await refinePhase(cache);

  // Output
  buildOutput(cache);
  console.log("\nDone. Cache preserved at", CACHE_PATH);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
