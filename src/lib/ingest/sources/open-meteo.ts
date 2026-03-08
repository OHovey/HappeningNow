/**
 * Open-Meteo Climate API adapter.
 *
 * Fetches 30-year daily climate data (1991–2020) and aggregates to monthly averages
 * for temperature and rain days. Populates the destinations.weather_data JSONB column.
 */

import pLimit from "p-limit";
import { createClient } from "@supabase/supabase-js";

const CLIMATE_API = "https://climate-api.open-meteo.com/v1/climate";
const START_DATE = "1991-01-01";
const END_DATE = "2020-12-31";
const YEARS = 30;
/** WMO standard: a "rain day" has >= 1.0mm precipitation */
const RAIN_DAY_THRESHOLD_MM = 1.0;

interface MonthlyWeather {
  temp_c: number;
  rain_days: number;
  sunshine_hours: null;
}

export type WeatherData = Record<string, MonthlyWeather>;

interface ClimateResponse {
  daily: {
    time: string[];
    temperature_2m_mean: (number | null)[];
    precipitation_sum: (number | null)[];
  };
}

interface DestinationRow {
  id: string;
  name: string;
  lng: number;
  lat: number;
  weather_data: unknown;
}

export interface WeatherIngestResult {
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Fetch 30-year daily climate data and aggregate to monthly averages.
 */
export async function fetchClimateData(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const url = new URL(CLIMATE_API);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("start_date", START_DATE);
  url.searchParams.set("end_date", END_DATE);
  url.searchParams.set("models", "EC_Earth3P_HR");
  url.searchParams.set("daily", "temperature_2m_mean,precipitation_sum");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Open-Meteo API error: ${res.status} ${res.statusText}`);
  }

  const data: ClimateResponse = await res.json();
  return aggregateToMonthly(data.daily);
}

/**
 * Aggregate daily values into monthly averages.
 */
export function aggregateToMonthly(daily: ClimateResponse["daily"]): WeatherData {
  // Accumulate per calendar month (1–12)
  const tempSums: number[] = new Array(12).fill(0);
  const tempCounts: number[] = new Array(12).fill(0);
  const rainDayCounts: number[] = new Array(12).fill(0);

  for (let i = 0; i < daily.time.length; i++) {
    // time format: "YYYY-MM-DD"
    const month = parseInt(daily.time[i].slice(5, 7), 10) - 1; // 0-indexed

    const temp = daily.temperature_2m_mean[i];
    if (temp !== null) {
      tempSums[month] += temp;
      tempCounts[month]++;
    }

    const precip = daily.precipitation_sum[i];
    if (precip !== null && precip >= RAIN_DAY_THRESHOLD_MM) {
      rainDayCounts[month]++;
    }
  }

  const result: WeatherData = {};
  for (let m = 0; m < 12; m++) {
    const key = String(m + 1);
    result[key] = {
      temp_c: tempCounts[m] > 0
        ? Math.round((tempSums[m] / tempCounts[m]) * 10) / 10
        : 0,
      rain_days: Math.round((rainDayCounts[m] / YEARS) * 10) / 10,
      sunshine_hours: null,
    };
  }

  return result;
}

/**
 * Main ingest function: fetch climate data for all destinations and update DB.
 */
export async function ingestWeatherData(
  force = false
): Promise<WeatherIngestResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Fetch all destinations with coordinates
  const { data: destinations, error: fetchErr } = await supabase.rpc(
    "get_destinations_with_coords"
  );

  if (fetchErr || !destinations) {
    throw new Error(
      `Failed to fetch destinations: ${fetchErr?.message ?? "no data"}`
    );
  }

  const rows = destinations as DestinationRow[];
  const toProcess = force
    ? rows
    : rows.filter((d) => d.weather_data === null);

  const skipped = rows.length - toProcess.length;
  let updated = 0;
  const errors: string[] = [];

  const limit = pLimit(5);

  await Promise.all(
    toProcess.map((dest) =>
      limit(async () => {
        try {
          const weatherData = await fetchClimateData(dest.lat, dest.lng);

          const { error: updateErr } = await supabase
            .from("destinations")
            .update({ weather_data: weatherData as unknown as Record<string, { temp_c: number; rain_days: number; sunshine_hours: number }> })
            .eq("id", dest.id);

          if (updateErr) {
            errors.push(`${dest.name}: ${updateErr.message}`);
          } else {
            updated++;
          }
        } catch (err) {
          errors.push(
            `${dest.name}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      })
    )
  );

  return { updated, skipped, errors };
}
