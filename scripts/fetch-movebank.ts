/**
 * Fetch migration route data from Movebank and upsert into migration_routes table.
 *
 * Usage:
 *   npx tsx scripts/fetch-movebank.ts            # Fetch and upsert
 *   npx tsx scripts/fetch-movebank.ts --dry-run   # Print stats only
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MOVEBANK_USERNAME / MOVEBANK_PASSWORD
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import simplify from "simplify-js";

// ---------------------------------------------------------------------------
// Target species config
// ---------------------------------------------------------------------------

interface SpeciesConfig {
  studyId: number;
  species: string;
  commonName: string;
  slug: string;
  description: string;
  peakMonths: number[];
  imageUrl: string | null;
  /** Some studies use Argos instead of GPS — omit sensor filter */
  sensorTypeId?: string;
}

// Study IDs verified against Movebank public datasets with download access
const SPECIES: SpeciesConfig[] = [
  {
    studyId: 208413731,
    species: "Connochaetes taurinus",
    commonName: "Wildebeest",
    slug: "wildebeest-serengeti-mara",
    description:
      "Annual migration circuit between the Serengeti plains and the Masai Mara, following seasonal rains and fresh grazing.",
    peakMonths: [6, 7, 8, 9, 10],
    imageUrl: null,
    sensorTypeId: "653",
  },
  {
    studyId: 5161274049,
    species: "Megaptera novaeangliae",
    commonName: "Humpback Whale",
    slug: "humpback-whale-southern",
    description:
      "Humpback whales tracked along the South American Pacific coast during their migration between feeding and breeding grounds.",
    peakMonths: [6, 7, 8, 9, 10],
    imageUrl: null,
    sensorTypeId: "653",
  },
  {
    studyId: 49913271,
    species: "Pandion haliaetus",
    commonName: "Osprey",
    slug: "osprey-europe-africa",
    description:
      "Ospreys migrate from Scandinavian breeding grounds to wintering sites in West Africa, crossing the Mediterranean and Sahara.",
    peakMonths: [8, 9, 10, 3, 4],
    imageUrl: null,
    sensorTypeId: "653",
  },
  {
    studyId: 727170503,
    species: "Sterna paradisaea",
    commonName: "Arctic Tern",
    slug: "arctic-tern-pole-to-pole",
    description:
      "The longest migration of any animal — Arctic terns travel from Arctic breeding grounds to Antarctic seas and back each year.",
    peakMonths: [5, 6, 7, 8],
    imageUrl: null,
    // Solar geolocator — no sensor filter needed
  },
  {
    studyId: 5868290211,
    species: "Rangifer tarandus",
    commonName: "Caribou",
    slug: "caribou-north-america",
    description:
      "Fortymile caribou herd migration across interior Alaska, one of North America's great ungulate migrations.",
    peakMonths: [4, 5, 6],
    imageUrl: null,
    sensorTypeId: "653",
  },
  {
    studyId: 1718959411,
    species: "Limosa lapponica",
    commonName: "Bar-tailed Godwit",
    slug: "bar-tailed-godwit-alaska-nz",
    description:
      "Bar-tailed godwits make the longest non-stop flight of any bird, flying from Alaska to New Zealand each autumn.",
    peakMonths: [9, 10, 11],
    imageUrl: null,
    // Argos telemetry — no sensor filter
  },
];

// ---------------------------------------------------------------------------
// Movebank CSV fetching + parsing (with license acceptance)
// ---------------------------------------------------------------------------

interface TrackPoint {
  timestamp: number;
  lng: number;
  lat: number;
}

async function fetchMovebankTrack(
  config: SpeciesConfig,
  username: string,
  password: string
): Promise<TrackPoint[]> {
  const baseUrl = "https://www.movebank.org/movebank/service/direct-read";
  const params = new URLSearchParams({
    entity_type: "event",
    study_id: String(config.studyId),
    attributes: "timestamp,location_long,location_lat",
  });
  if (config.sensorTypeId) {
    params.set("sensor_type_id", config.sensorTypeId);
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}` };

  // First request — may return license terms as HTML
  const res1 = await fetch(`${baseUrl}?${params}`, { headers });
  if (!res1.ok) {
    throw new Error(`API error: ${res1.status} ${res1.statusText}`);
  }

  let body = await res1.text();

  // Check if response is license terms (HTML)
  if (body.trimStart().startsWith("<html") || body.trimStart().startsWith("<p>")) {
    // Accept license by sending MD5 hash of the license text
    const md5 = createHash("md5").update(body).digest("hex");
    params.set("license-md5", md5);

    const res2 = await fetch(`${baseUrl}?${params}`, { headers });
    if (!res2.ok) {
      throw new Error(`API error after license accept: ${res2.status}`);
    }
    body = await res2.text();

    // Still HTML? Permission denied
    if (body.trimStart().startsWith("<html") || body.trimStart().startsWith("<p>")) {
      throw new Error("License acceptance failed — check permissions on movebank.org");
    }
  }

  return parseCSV(body);
}

function parseCSV(csv: string): TrackPoint[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());
  const tsIdx = header.indexOf("timestamp");
  const lngIdx = header.indexOf("location_long");
  const latIdx = header.indexOf("location_lat");

  if (tsIdx === -1 || lngIdx === -1 || latIdx === -1) {
    throw new Error(`Unexpected CSV headers: ${header.join(", ")}`);
  }

  const points: TrackPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const lng = parseFloat(cols[lngIdx]);
    const lat = parseFloat(cols[latIdx]);
    const ts = new Date(cols[tsIdx]).getTime();

    if (!isNaN(lng) && !isNaN(lat) && !isNaN(ts)) {
      points.push({ timestamp: ts, lng, lat });
    }
  }

  // Sort by timestamp
  points.sort((a, b) => a.timestamp - b.timestamp);
  return points;
}

// ---------------------------------------------------------------------------
// Simplification + GeoJSON
// ---------------------------------------------------------------------------

function simplifyRoute(
  points: TrackPoint[],
  targetCount = 150
): [number, number][] {
  if (points.length <= targetCount) {
    return points.map((p) => [p.lng, p.lat]);
  }

  // simplify-js expects {x, y} objects
  const xyPoints = points.map((p) => ({ x: p.lng, y: p.lat }));

  // Binary search for the right tolerance to get ~targetCount points
  let lo = 0.00001;
  let hi = 100;
  let result = xyPoints;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    result = simplify(xyPoints, mid, true);
    if (result.length > targetCount) {
      lo = mid;
    } else {
      hi = mid;
    }
    if (Math.abs(result.length - targetCount) < 15) break;
  }

  return result.map((p) => [p.x, p.y]);
}

// ---------------------------------------------------------------------------
// Database upsert
// ---------------------------------------------------------------------------

async function executeSql(
  supabase: SupabaseClient,
  sql: string
): Promise<void> {
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }
}

async function upsertRoute(
  supabase: SupabaseClient,
  config: SpeciesConfig,
  coordinates: [number, number][]
): Promise<void> {
  const geojson = JSON.stringify({
    type: "LineString",
    coordinates,
  });

  const name = `${config.commonName} Migration`.replace(/'/g, "''");
  const species = config.species.replace(/'/g, "''");
  const slug = config.slug.replace(/'/g, "''");
  const desc = config.description
    ? `'${config.description.replace(/'/g, "''")}'`
    : "NULL";
  const peakMonths = `ARRAY[${config.peakMonths.join(",")}]::integer[]`;
  const imgUrl = config.imageUrl ? `'${config.imageUrl}'` : "NULL";

  // Upsert by slug
  const sql = `
    INSERT INTO migration_routes (species, name, slug, route, peak_months, description, image_url)
    VALUES (
      '${species}',
      '${name}',
      '${slug}',
      ST_SetSRID(ST_GeomFromGeoJSON('${geojson}'), 4326),
      ${peakMonths},
      ${desc},
      ${imgUrl}
    )
    ON CONFLICT (slug) DO UPDATE SET
      species = EXCLUDED.species,
      name = EXCLUDED.name,
      route = EXCLUDED.route,
      peak_months = EXCLUDED.peak_months,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url;
  `;

  await executeSql(supabase, sql);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const help = args.includes("--help");

  if (help) {
    console.log("Usage: npx tsx scripts/fetch-movebank.ts [--dry-run] [--help]");
    process.exit(0);
  }

  const username = process.env.MOVEBANK_USERNAME;
  const password = process.env.MOVEBANK_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!username || !password) {
    console.error(
      "Error: MOVEBANK_USERNAME and MOVEBANK_PASSWORD env vars required."
    );
    console.error("Sign up free at https://www.movebank.org");
    process.exit(1);
  }

  if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required (or use --dry-run)."
    );
    process.exit(1);
  }

  const supabase = dryRun
    ? (null as unknown as SupabaseClient)
    : createClient(supabaseUrl!, serviceRoleKey!, {
        auth: { persistSession: false },
      });

  console.log(
    `Fetching migration routes for ${SPECIES.length} species${dryRun ? " (dry run)" : ""}...\n`
  );

  let success = 0;
  let failed = 0;

  for (const config of SPECIES) {
    process.stdout.write(`  ${config.commonName}... `);
    try {
      const raw = await fetchMovebankTrack(config, username, password);
      if (raw.length === 0) {
        console.log(`no data (study ${config.studyId})`);
        failed++;
        continue;
      }

      const simplified = simplifyRoute(raw);
      console.log(
        `${raw.length} points -> ${simplified.length} simplified`
      );

      if (!dryRun) {
        await upsertRoute(supabase, config, simplified);
        process.stdout.write(`    -> upserted to migration_routes\n`);
      }

      success++;
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed.`);
  if (dryRun) console.log("(Dry run — no data written to DB)");
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
