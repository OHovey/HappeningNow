/**
 * Shared crowd score to color/label mapping.
 * Used by heatmap layer, destination pages, and calendar grid.
 *
 * Gradient: cool-to-warm (purple/blue low to orange/red packed).
 */

/** 10-value hex color lookup: index 0 = score 1 (empty), index 9 = score 10 (packed) */
export const CROWD_COLORS = [
  '#7c3aed', // 1  — purple (empty)
  '#6366f1', // 2  — indigo
  '#3b82f6', // 3  — blue
  '#06b6d4', // 4  — cyan
  '#10b981', // 5  — emerald
  '#84cc16', // 6  — lime
  '#eab308', // 7  — yellow
  '#f97316', // 8  — orange
  '#ef4444', // 9  — red
  '#991b1b', // 10 — dark red (packed)
] as const;

/**
 * Map a crowd score (1-10) to a hex color string.
 * Clamps out-of-range values.
 */
export function crowdScoreToColor(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  return CROWD_COLORS[clamped - 1];
}

/**
 * Map a crowd score (1-10) to a human-readable label.
 */
export function crowdScoreToLabel(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  if (clamped <= 3) return 'Low season';
  if (clamped <= 6) return 'Moderate';
  if (clamped <= 8) return 'Busy';
  return 'Peak crowds';
}

/**
 * Map a crowd score (1-10) to a rough tourist volume estimate.
 */
export function estimateTouristVolume(score: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  if (clamped <= 2) return 'Very few tourists';
  if (clamped <= 4) return 'Light flow';
  if (clamped <= 6) return 'Moderate flow';
  if (clamped <= 8) return 'Heavy crowds';
  return 'Extremely busy';
}
