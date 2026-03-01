/**
 * Filter logic for timeline and category filtering of map events.
 *
 * Uses source-level filtering (filterGeoJSON + setData) rather than
 * layer-level setFilter so that clustering counts reflect only
 * visible events. With ~600 events this is imperceptible.
 */

/**
 * Returns true if the given month falls within [start, end],
 * handling year-boundary wrap (e.g. start=11, end=2 means Nov-Feb).
 */
function isMonthInRange(
  month: number,
  startMonth: number,
  endMonth: number
): boolean {
  if (startMonth <= endMonth) {
    // Normal range: e.g. Mar(3) to Jun(6)
    return month >= startMonth && month <= endMonth;
  }
  // Year-boundary wrap: e.g. Nov(11) to Feb(2)
  return month >= startMonth || month <= endMonth;
}

/**
 * Filters a GeoJSON FeatureCollection by month and active categories.
 * Returns a new FeatureCollection containing only matching features.
 */
export function filterGeoJSON(
  geojson: GeoJSON.FeatureCollection,
  month: number,
  categories: string[]
): GeoJSON.FeatureCollection {
  const filtered = geojson.features.filter((feature) => {
    const props = feature.properties;
    if (!props) return false;

    // Month filter: feature must span the selected month
    const startMonth = props.start_month as number;
    const endMonth = props.end_month as number;
    if (!isMonthInRange(month, startMonth, endMonth)) return false;

    // Category filter: feature category must be in active list
    const category = props.category as string;
    if (!categories.includes(category)) return false;

    return true;
  });

  return {
    type: 'FeatureCollection',
    features: filtered,
  };
}

/**
 * Builds a MapLibre filter expression for month filtering.
 * For use with setFilter() when source-level filtering is not needed.
 */
export function buildMonthFilter(month: number): unknown[] {
  return [
    'all',
    ['<=', ['get', 'start_month'], month],
    ['>=', ['get', 'end_month'], month],
  ];
}

/**
 * Builds a MapLibre filter expression for category filtering.
 * For use with setFilter() when source-level filtering is not needed.
 */
export function buildCategoryFilter(categories: string[]): unknown[] {
  return ['in', ['get', 'category'], ['literal', categories]];
}

/**
 * Returns the current month (1-12) for setting the default view.
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}
