/** Category color palette for event markers */
export const CATEGORY_COLORS = {
  festival: '#f97316',
  wildlife: '#22c55e',
  other: '#3b82f6',
} as const;

/** Abbreviated month names */
export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Default map view settings */
export const MAP_DEFAULTS = {
  center: [0, 20] as [number, number],
  zoom: 2,
} as const;

/** OpenFreeMap tile style URL */
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
