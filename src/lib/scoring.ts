/**
 * "Worth the trip" scoring and indicator tags for search result ranking.
 *
 * Score is hidden from users -- determines rank order only.
 * Uniqueness (scale) is the dominant weighting factor per user decision.
 */

interface ScoredEvent {
  scale: number;
  crowd_level: string | null;
  distance_meters: number;
}

const CROWD_FACTOR: Record<string, number> = {
  quiet: 1.0,
  moderate: 0.7,
  busy: 0.4,
};

/**
 * "Worth the trip" ranking score. Higher = more worth the trip.
 *
 * Formula: (scale^2 * crowdFactor) / log2(distanceKm + 1)
 * - scale squared makes uniqueness the dominant factor
 * - crowd factor reduces score for busy events
 * - log2 distance dampens distance penalty (far events still rank well if unique)
 * - Min distance 1km to avoid division by zero
 */
export function worthTheTripScore(event: ScoredEvent): number {
  const uniqueness = event.scale * event.scale;
  const distanceKm = Math.max(event.distance_meters / 1000, 1);
  const crowdFactor = CROWD_FACTOR[event.crowd_level ?? 'moderate'] ?? 0.7;
  return (uniqueness * crowdFactor) / Math.log2(distanceKm + 1);
}

/**
 * Haversine straight-line travel time estimate at ~60km/h average.
 * Returns human-readable string like "30min drive" or "2.0h drive".
 */
export function estimateTravelTime(distanceMeters: number): string {
  const hours = distanceMeters / 1000 / 60;
  if (hours < 1) return `${Math.round(hours * 60)}min drive`;
  return `${hours.toFixed(1)}h drive`;
}

/**
 * Generate quick indicator tags for a search result card.
 * Tags explain ranking without showing the hidden score.
 */
export function getIndicatorTags(event: ScoredEvent): string[] {
  const tags: string[] = [];
  if (event.scale >= 8) tags.push('Highly Unique');
  else if (event.scale >= 6) tags.push('Unique');
  if (event.crowd_level === 'quiet') tags.push('Low Crowds');
  tags.push(estimateTravelTime(event.distance_meters));
  return tags;
}
