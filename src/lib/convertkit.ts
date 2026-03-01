/**
 * Kit (ConvertKit) API v4 helper functions.
 *
 * Server-side only -- never import from client components.
 * KIT_API_KEY must be set in environment variables.
 */

const BASE = 'https://api.kit.com/v4';

function headers(): HeadersInit {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    throw new Error(
      'KIT_API_KEY environment variable is not set. Get your API key from Kit Dashboard -> Settings -> Developer -> API Key (v4).'
    );
  }
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };
}

/**
 * Replace with real tag IDs from Kit Dashboard -> Subscribers -> Tags.
 * Each key maps to a Kit tag ID used for interest-based segmentation.
 */
export const TAG_IDS: Record<string, number> = {
  festivals: 0,
  wildlife: 0,
};

/**
 * Create a subscriber in Kit. If the subscriber already exists (422),
 * attempts to fetch the existing subscriber by email.
 */
export async function createSubscriber(
  email: string
): Promise<{ id: number; email: string }> {
  const res = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email, state: 'active' }),
  });

  if (res.ok) {
    const data = await res.json();
    return data.subscriber;
  }

  // 422 = subscriber already exists -- fetch existing
  if (res.status === 422) {
    const listRes = await fetch(
      `${BASE}/subscribers?email_address=${encodeURIComponent(email)}`,
      { method: 'GET', headers: headers() }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.subscribers && listData.subscribers.length > 0) {
        const sub = listData.subscribers[0];
        return { id: sub.id, email: sub.email_address };
      }
    }

    throw new Error(`Subscriber with email ${email} exists but could not be retrieved`);
  }

  const errorBody = await res.text();
  throw new Error(`Kit API error (${res.status}): ${errorBody}`);
}

/**
 * Tag an existing subscriber. Subscriber MUST exist before tagging
 * (Kit API v4 pitfall: tagging a non-existent subscriber fails silently
 * or errors). Always call createSubscriber first.
 */
export async function tagSubscriber(
  subscriberId: number,
  tagId: number
): Promise<void> {
  if (tagId === 0) return; // Skip placeholder/unconfigured tags

  const res = await fetch(`${BASE}/tags/${tagId}/subscribers/${subscriberId}`, {
    method: 'POST',
    headers: headers(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Kit API tag error (${res.status}): ${errorBody}`);
  }
}
