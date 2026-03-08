/**
 * Shared utilities for Apify source adapters.
 */

const APIFY_BASE = 'https://api.apify.com/v2';

/**
 * Fetch the latest dataset items from an Apify Actor's most recent run.
 */
export async function fetchApifyDataset(
  actorId: string,
  token: string,
): Promise<unknown[]> {
  // Apify API uses ~ separator for namespaced actors (e.g. username~actor-name)
  const encodedActorId = actorId.replace('/', '~');
  const url = `${APIFY_BASE}/acts/${encodedActorId}/runs/last/dataset/items?token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Apify API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error('Apify dataset response is not an array');
  }

  return data;
}

/**
 * Generate a deterministic source ID from event fields for dedup.
 * Uses a simple string hash converted to base36.
 */
export function hashSourceId(name: string, country: string, sourceUrl: string): string {
  const input = `${name}|${country}|${sourceUrl}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to unsigned 32-bit then to base36
  return (hash >>> 0).toString(36);
}
