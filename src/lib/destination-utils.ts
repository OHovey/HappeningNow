/**
 * Destination utility functions for best-month computation and weather formatting.
 */

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface WeatherMonth {
  temp_c: number;
  rain_days: number;
  sunshine_hours: number;
}

interface BestMonthsResult {
  months: number[];
  explanation: string;
}

/**
 * Analyze crowd scores and weather data to recommend 2-3 best months to visit.
 * Weight: crowd 60%, weather 40%.
 *
 * Lower crowd score = better. Higher sunshine, lower rain, moderate temp (18-28) = better weather.
 */
export function computeBestMonths(
  crowdData: Record<string, number> | null,
  weatherData: Record<string, WeatherMonth> | null,
): BestMonthsResult {
  const scores: { month: number; score: number }[] = [];

  for (let m = 1; m <= 12; m++) {
    const crowd = crowdData?.[String(m)] ?? 5;
    const weather = weatherData?.[String(m)] ?? null;

    // Crowd score: lower is better. Normalize to 0-1 (1 = best, 0 = worst).
    const crowdNorm = 1 - (crowd - 1) / 9;

    // Weather score: combine temp comfort, low rain, high sunshine
    let weatherNorm = 0.5; // default if no weather data
    if (weather) {
      // Temperature comfort: ideal range 18-28C, penalty outside
      const tempIdeal = 23;
      const tempRange = 10;
      const tempScore = Math.max(0, 1 - Math.abs(weather.temp_c - tempIdeal) / tempRange);

      // Rain: fewer days is better (0-30 scale)
      const rainScore = Math.max(0, 1 - weather.rain_days / 25);

      // Sunshine: more is better (0-350 range typical)
      const sunScore = Math.min(1, weather.sunshine_hours / 300);

      weatherNorm = tempScore * 0.35 + rainScore * 0.35 + sunScore * 0.3;
    }

    const totalScore = crowdNorm * 0.6 + weatherNorm * 0.4;
    scores.push({ month: m, score: totalScore });
  }

  // Sort by score descending, pick top 2-3
  scores.sort((a, b) => b.score - a.score);

  // Pick top 2, add 3rd if it's within 5% of the 2nd
  const bestMonths = [scores[0].month, scores[1].month];
  if (scores.length > 2 && scores[2].score >= scores[1].score * 0.95) {
    bestMonths.push(scores[2].month);
  }

  // Sort chronologically for display
  bestMonths.sort((a, b) => a - b);

  // Generate explanation
  const monthNames = bestMonths.map((m) => MONTH_NAMES_FULL[m - 1]);
  const conjunction =
    monthNames.length === 2
      ? `${monthNames[0]} and ${monthNames[1]}`
      : `${monthNames.slice(0, -1).join(', ')}, and ${monthNames[monthNames.length - 1]}`;

  const explanation = `${conjunction} offer the best combination of pleasant weather and fewer crowds.`;

  return { months: bestMonths, explanation };
}

/**
 * Format a temperature in Celsius.
 */
export function formatTemperature(tempC: number): string {
  return `${Math.round(tempC)}\u00B0C`;
}

/**
 * Format a compact weather summary for a month.
 */
export function formatWeatherSummary(weather: WeatherMonth): string {
  return `${formatTemperature(weather.temp_c)} \u00B7 ${weather.rain_days} rain days \u00B7 ${weather.sunshine_hours}h sun`;
}

/**
 * Get short month name (Jan, Feb, etc.) from 1-indexed month number.
 */
export function monthName(month: number): string {
  return MONTH_NAMES_SHORT[month - 1] ?? '';
}
