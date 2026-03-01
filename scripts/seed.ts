/**
 * Seed script: loads festival, wildlife, destination, and migration route data
 * into Supabase PostGIS database.
 *
 * Usage:
 *   npm run seed            # Full seed (clears existing data)
 *   npm run seed -- --force  # Skip confirmation prompt
 *   npm run seed -- --dry-run # Validate data without inserting
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL  — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Service role key (Dashboard > Settings > API)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as readline from "readline";

// ---------------------------------------------------------------------------
// Types for seed data
// ---------------------------------------------------------------------------

interface SeedEvent {
  name: string;
  slug: string;
  category: "festival" | "wildlife";
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
  longitude: number;
  latitude: number;
  country: string | null;
  region: string | null;
  scale: number;
  crowd_level: "quiet" | "moderate" | "busy" | null;
  booking_destination_id: string | null;
  getyourguide_location_id: string | null;
}

interface SeedDestination {
  name: string;
  slug: string;
  country: string;
  region: string | null;
  longitude: number;
  latitude: number;
  crowd_data: Record<string, number>;
  weather_data: Record<string, { temp_c: number; rain_days: number; sunshine_hours: number }>;
}

interface SeedMigrationRoute {
  species: string;
  name: string;
  slug: string;
  description: string | null;
  route_coordinates: [number, number][];
  peak_months: number[];
  image_url: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50;

function loadJSON<T>(relativePath: string): T {
  const fullPath = resolve(__dirname, "..", relativePath);
  const raw = readFileSync(fullPath, "utf-8");
  return JSON.parse(raw) as T;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

// ---------------------------------------------------------------------------
// Insert functions using raw SQL via supabase.rpc
// ---------------------------------------------------------------------------

/**
 * We use a helper RPC approach: call supabase's built-in SQL execution.
 * Since Supabase JS client doesn't support PostGIS geometry natively,
 * we insert via raw SQL using the `exec_sql` function or direct REST.
 *
 * Alternative approach: use supabase-js `.from().insert()` with the
 * location column set to a WKT string that PostGIS can parse via a
 * database trigger/default. However, the cleanest approach is raw SQL.
 *
 * We'll use the REST API directly with the service role key to execute
 * raw SQL via the /rest/v1/rpc endpoint.
 */

async function executeSql(supabase: SupabaseClient, sql: string): Promise<void> {
  // Use the Supabase Management API or direct PostgreSQL connection
  // Since we can't run raw SQL through supabase-js directly,
  // we'll use the PostgREST API with a custom function.
  // First, let's try creating a temporary exec function.

  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    // If exec_sql doesn't exist, we need an alternative approach
    throw new Error(`SQL execution failed: ${error.message}`);
  }
}

async function ensureExecSqlFunction(supabaseUrl: string, serviceRoleKey: string): Promise<void> {
  // Create the exec_sql helper function if it doesn't exist
  const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ query: "SELECT 1" }),
  });

  if (response.status === 404 || !response.ok) {
    // Function doesn't exist yet — create it via the SQL API
    // We need to use the Supabase SQL endpoint
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!createResponse.ok) {
      // Try creating via a direct approach: use supabase-js to create
      // the function through a migration-style approach
      console.log(
        "Note: exec_sql function not found. Will attempt to create it."
      );
      console.log(
        "If this fails, please run the following SQL in your Supabase SQL Editor:"
      );
      console.log(sql);
      console.log("");

      // Attempt direct PostgreSQL REST API
      const directResponse = await fetch(`${supabaseUrl}/pg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!directResponse.ok) {
        throw new Error(
          "Cannot create exec_sql function. Please create it manually in Supabase SQL Editor:\n" +
            sql
        );
      }
    }
  }
}

async function insertEvents(
  supabase: SupabaseClient,
  events: SeedEvent[],
  dryRun: boolean
): Promise<number> {
  console.log(`\nInserting ${events.length} events...`);
  let inserted = 0;

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);

    if (dryRun) {
      inserted += batch.length;
      process.stdout.write(
        `  [dry-run] Validated ${inserted}/${events.length} events\r`
      );
      continue;
    }

    // Build INSERT VALUES for this batch
    const values = batch
      .map((e) => {
        const desc = e.description
          ? `'${e.description.replace(/'/g, "''")}'`
          : "NULL";
        const name = e.name.replace(/'/g, "''");
        const slug = e.slug.replace(/'/g, "''");
        const country = e.country
          ? `'${e.country.replace(/'/g, "''")}'`
          : "NULL";
        const region = e.region
          ? `'${e.region.replace(/'/g, "''")}'`
          : "NULL";
        const crowd = e.crowd_level ? `'${e.crowd_level}'` : "NULL";
        const booking = e.booking_destination_id
          ? `'${e.booking_destination_id}'`
          : "NULL";
        const gyg = e.getyourguide_location_id
          ? `'${e.getyourguide_location_id}'`
          : "NULL";

        return `('${name}', '${slug}', '${e.category}', ${desc}, ${
          e.image_url ? `'${e.image_url}'` : "NULL"
        }, ${e.start_month}, ${e.end_month}, ST_SetSRID(ST_MakePoint(${e.longitude}, ${e.latitude}), 4326), ${country}, ${region}, ${e.scale}, ${crowd}, ${booking}, ${gyg})`;
      })
      .join(",\n");

    const sql = `INSERT INTO events (name, slug, category, description, image_url, start_month, end_month, location, country, region, scale, crowd_level, booking_destination_id, getyourguide_location_id) VALUES ${values};`;

    try {
      await executeSql(supabase, sql);
      inserted += batch.length;
      process.stdout.write(
        `  Inserted ${inserted}/${events.length} events\r`
      );
    } catch (err) {
      console.error(
        `\n  Error inserting batch starting at index ${i}:`,
        err
      );
      throw err;
    }
  }

  console.log(`\n  Done: ${inserted} events inserted.`);
  return inserted;
}

async function insertDestinations(
  supabase: SupabaseClient,
  destinations: SeedDestination[],
  dryRun: boolean
): Promise<number> {
  console.log(`\nInserting ${destinations.length} destinations...`);
  let inserted = 0;

  for (const d of destinations) {
    if (dryRun) {
      inserted++;
      continue;
    }

    const name = d.name.replace(/'/g, "''");
    const slug = d.slug.replace(/'/g, "''");
    const country = d.country.replace(/'/g, "''");
    const region = d.region ? `'${d.region.replace(/'/g, "''")}'` : "NULL";
    const crowdJson = JSON.stringify(d.crowd_data).replace(/'/g, "''");
    const weatherJson = JSON.stringify(d.weather_data).replace(/'/g, "''");

    const sql = `INSERT INTO destinations (name, slug, country, region, location, crowd_data, weather_data) VALUES ('${name}', '${slug}', '${country}', ${region}, ST_SetSRID(ST_MakePoint(${d.longitude}, ${d.latitude}), 4326), '${crowdJson}'::jsonb, '${weatherJson}'::jsonb);`;

    try {
      await executeSql(supabase, sql);
      inserted++;
    } catch (err) {
      console.error(`  Error inserting destination "${d.name}":`, err);
      throw err;
    }
  }

  console.log(`  Done: ${inserted} destinations inserted.`);
  return inserted;
}

async function insertMigrationRoutes(
  supabase: SupabaseClient,
  routes: SeedMigrationRoute[],
  dryRun: boolean
): Promise<number> {
  console.log(`\nInserting ${routes.length} migration routes...`);
  let inserted = 0;

  for (const r of routes) {
    if (dryRun) {
      inserted++;
      continue;
    }

    const name = r.name.replace(/'/g, "''");
    const slug = r.slug.replace(/'/g, "''");
    const species = r.species.replace(/'/g, "''");
    const desc = r.description
      ? `'${r.description.replace(/'/g, "''")}'`
      : "NULL";
    const peakMonths = `ARRAY[${r.peak_months.join(",")}]::integer[]`;

    // Build LineString from coordinates
    const geojson = JSON.stringify({
      type: "LineString",
      coordinates: r.route_coordinates,
    });

    const sql = `INSERT INTO migration_routes (species, name, slug, route, peak_months, description, image_url) VALUES ('${species}', '${name}', '${slug}', ST_SetSRID(ST_GeomFromGeoJSON('${geojson}'), 4326), ${peakMonths}, ${desc}, ${r.image_url ? `'${r.image_url}'` : "NULL"});`;

    try {
      await executeSql(supabase, sql);
      inserted++;
    } catch (err) {
      console.error(`  Error inserting route "${r.name}":`, err);
      throw err;
    }
  }

  console.log(`  Done: ${inserted} migration routes inserted.`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  // Validate environment (only required for non-dry-run)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
    console.error("Error: Missing environment variables.");
    console.error("Required:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL");
    console.error("  SUPABASE_SERVICE_ROLE_KEY");
    console.error("");
    console.error(
      "Set these in .env.local or export them before running this script."
    );
    console.error(
      "Or use --dry-run to validate data without connecting to Supabase."
    );
    process.exit(1);
  }

  // Load seed data
  console.log("Loading seed data...");
  const festivals = loadJSON<SeedEvent[]>("src/data/seed/festivals.json");
  // Wildlife JSON uses shortened keys (start/end/desc/crowd) — normalize to SeedEvent shape
  const wildlifeRaw = loadJSON<Record<string, unknown>[]>("src/data/seed/wildlife.json");
  const wildlife: SeedEvent[] = wildlifeRaw.map((w) => ({
    name: w.name as string,
    slug: w.slug as string,
    category: w.category as "festival" | "wildlife",
    description: (w.description ?? w.desc ?? null) as string | null,
    image_url: (w.image_url ?? null) as string | null,
    start_month: (w.start_month ?? w.start) as number,
    end_month: (w.end_month ?? w.end) as number,
    longitude: w.longitude as number,
    latitude: w.latitude as number,
    country: (w.country ?? null) as string | null,
    region: (w.region ?? null) as string | null,
    scale: w.scale as number,
    crowd_level: (w.crowd_level ?? w.crowd ?? null) as "quiet" | "moderate" | "busy" | null,
    booking_destination_id: (w.booking_destination_id ?? null) as string | null,
    getyourguide_location_id: (w.getyourguide_location_id ?? null) as string | null,
  }));
  const destinations = loadJSON<SeedDestination[]>(
    "src/data/seed/destinations.json"
  );
  const migrationRoutes = loadJSON<SeedMigrationRoute[]>(
    "src/data/seed/migration-routes.json"
  );

  console.log(`  Festivals:  ${festivals.length}`);
  console.log(`  Wildlife:   ${wildlife.length}`);
  console.log(`  Destinations: ${destinations.length}`);
  console.log(`  Migration routes: ${migrationRoutes.length}`);

  // Validate data
  const allEvents = [...festivals, ...wildlife];
  const invalidEvents = allEvents.filter(
    (e) =>
      !e.name ||
      !e.slug ||
      !e.category ||
      e.start_month < 1 ||
      e.start_month > 12 ||
      e.end_month < 1 ||
      e.end_month > 12 ||
      typeof e.longitude !== "number" ||
      typeof e.latitude !== "number" ||
      e.latitude < -90 ||
      e.latitude > 90 ||
      e.longitude < -180 ||
      e.longitude > 180
  );

  if (invalidEvents.length > 0) {
    console.error(`\nValidation failed: ${invalidEvents.length} invalid events found:`);
    invalidEvents.slice(0, 5).forEach((e) => {
      console.error(`  - ${e.name} (${e.category}): lat=${e.latitude}, lng=${e.longitude}, months=${e.start_month}-${e.end_month}`);
    });
    process.exit(1);
  }

  console.log("\nData validation passed.");

  if (dryRun) {
    console.log("\n--- DRY RUN MODE ---");
    console.log("Would insert:");
    console.log(`  ${allEvents.length} events (${festivals.length} festivals + ${wildlife.length} wildlife)`);
    console.log(`  ${destinations.length} destinations`);
    console.log(`  ${migrationRoutes.length} migration routes`);

    // Simulate insert counts
    await insertEvents({} as SupabaseClient, allEvents, true);
    await insertDestinations({} as SupabaseClient, destinations, true);
    await insertMigrationRoutes({} as SupabaseClient, migrationRoutes, true);

    console.log("\nDry run complete. No data was inserted.");
    return;
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { persistSession: false },
  });

  // Ensure exec_sql function exists
  console.log("\nChecking exec_sql helper function...");
  try {
    await ensureExecSqlFunction(supabaseUrl!, serviceRoleKey!);
    console.log("  exec_sql function ready.");
  } catch (err) {
    console.error("  Warning:", (err as Error).message);
    console.error("  Continuing anyway — will fail on first insert if function is missing.");
  }

  // Confirmation prompt
  if (!force) {
    console.log("\nThis will DELETE all existing data in events, destinations, and migration_routes tables.");
    const proceed = await confirm("Continue?");
    if (!proceed) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  // Clear existing data
  console.log("\nClearing existing data...");
  try {
    await executeSql(supabase, "TRUNCATE events, destinations, migration_routes CASCADE;");
    console.log("  Cleared.");
  } catch (err) {
    console.error("  Error clearing data:", (err as Error).message);
    console.error("  Tables may not exist yet. Run supabase/schema.sql first.");
    process.exit(1);
  }

  // Insert all data
  const eventCount = await insertEvents(supabase, allEvents, false);
  const destCount = await insertDestinations(supabase, destinations, false);
  const routeCount = await insertMigrationRoutes(supabase, migrationRoutes, false);

  // Verify counts
  console.log("\n--- Verification ---");
  console.log(`Events inserted:     ${eventCount} (expected ${allEvents.length})`);
  console.log(`Destinations:        ${destCount} (expected ${destinations.length})`);
  console.log(`Migration routes:    ${routeCount} (expected ${migrationRoutes.length})`);

  if (
    eventCount === allEvents.length &&
    destCount === destinations.length &&
    routeCount === migrationRoutes.length
  ) {
    console.log("\nSeed complete! All data inserted successfully.");
  } else {
    console.error("\nWarning: Some counts don't match expected values.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
