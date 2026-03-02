/**
 * Thin page detection for noindex decisions.
 *
 * Pages with fewer than THIN_PAGE_THRESHOLD events get noindex
 * UNLESS they have supplementary data (weather + crowd) that
 * makes the page valuable on its own (especially what-to-do pages).
 */

export const THIN_PAGE_THRESHOLD = 3;

/**
 * Determines if a programmatic SEO page should have a noindex meta tag.
 *
 * @param eventCount - Number of events on the page
 * @param hasWeatherData - Whether the page has weather information
 * @param hasCrowdData - Whether the page has crowd level data
 * @returns true if the page should be noindexed
 */
export function shouldNoindex(
  eventCount: number,
  hasWeatherData: boolean = false,
  hasCrowdData: boolean = false,
): boolean {
  // Pages at or above threshold are always indexable
  if (eventCount >= THIN_PAGE_THRESHOLD) {
    return false;
  }

  // Pages below threshold with BOTH weather and crowd data are still indexable
  if (hasWeatherData && hasCrowdData) {
    return false;
  }

  // Sparse pages without supplementary data should be noindexed
  return true;
}
