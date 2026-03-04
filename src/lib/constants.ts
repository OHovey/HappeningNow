import type { EventCategory } from '@/lib/supabase/types';

/** Category color palette for event markers */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  festival: '#f97316',
  concert: '#a855f7',
  sport: '#ef4444',
  arts: '#ec4899',
  event: '#3b82f6',
  wildlife: '#22c55e',
} as const;

/** Human-readable labels for each category */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  festival: 'Festivals',
  concert: 'Concerts',
  sport: 'Sports',
  arts: 'Arts',
  event: 'Events',
  wildlife: 'Wildlife',
} as const;

/** Emoji icons for each category */
export const CATEGORY_EMOJIS: Record<EventCategory, string> = {
  festival: '\u{1F3AA}',
  concert: '\u{1F3B5}',
  sport: '\u{1F3C6}',
  arts: '\u{1F3AD}',
  event: '\u{1F4C5}',
  wildlife: '\u{1F43E}',
} as const;

/** Ordered list of all categories */
export const ALL_CATEGORIES: EventCategory[] = [
  'festival', 'concert', 'sport', 'arts', 'event', 'wildlife',
] as const;

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
