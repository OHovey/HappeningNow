import { describe, it, expect } from 'vitest';
import { buildEventMetadata } from '@/lib/structured-data';
import type { Event } from '@/lib/supabase/types';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'test-id',
    name: 'Holi Festival of Colors',
    slug: 'holi-festival-of-colors',
    category: 'festival',
    description: 'Vibrant Hindu spring festival celebrated across India.',
    image_url: 'https://example.com/holi.jpg',
    start_month: 3,
    end_month: 3,
    location: null,
    country: 'India',
    region: 'Rajasthan',
    scale: 5,
    crowd_level: 'busy',
    booking_destination_id: null,
    getyourguide_location_id: null,
    migration_route_id: null,
    start_date: null,
    end_date: null,
    status: 'active',
    last_confirmed_at: null,
    confidence: 1.0,
    source: 'manual',
    source_id: null,
    location_approximate: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildEventMetadata', () => {
  it('title matches event name', () => {
    const meta = buildEventMetadata(makeEvent());
    expect(meta.title).toBe('Holi Festival of Colors');
  });

  it('openGraph.images contains event image_url when present', () => {
    const meta = buildEventMetadata(makeEvent());
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<{ url: string }>;
    expect(images).toHaveLength(1);
    expect(images[0].url).toBe('https://example.com/holi.jpg');
  });

  it('openGraph.images is empty array when image_url is null', () => {
    const meta = buildEventMetadata(makeEvent({ image_url: null }));
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<{ url: string }>;
    expect(images).toHaveLength(0);
  });

  it('description falls back to "Discover {name}" when event description is null', () => {
    const meta = buildEventMetadata(makeEvent({ description: null }));
    expect(meta.description).toBe('Discover Holi Festival of Colors');
  });
});
