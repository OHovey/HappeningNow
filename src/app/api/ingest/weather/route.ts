import { NextResponse } from "next/server";
import { ingestWeatherData } from "@/lib/ingest/sources/open-meteo";

/**
 * POST /api/ingest/weather
 *
 * Fetch 30-year climate averages from Open-Meteo and populate
 * destinations.weather_data for all destinations with null weather_data.
 *
 * Query params:
 *   ?force=true — re-fetch all destinations (not just nulls)
 *
 * Auth: Bearer ${INGEST_SECRET}
 */
export async function POST(request: Request) {
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  try {
    console.log(
      `[weather-ingest] Starting${force ? " (force mode)" : ""}...`
    );
    const result = await ingestWeatherData(force);
    console.log(
      `[weather-ingest] Done: ${result.updated} updated, ${result.skipped} skipped, ${result.errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[weather-ingest] Fatal error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

/** GET handler for Vercel Cron (sends GET by default). */
export async function GET(request: Request) {
  return POST(request);
}
