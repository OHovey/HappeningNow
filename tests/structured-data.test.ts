import { describe, it, expect } from 'vitest';
import { buildEventJsonLd } from '@/lib/structured-data';
import type { Event } from '@/lib/supabase/types';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'test-id',
    name: 'Songkran Water Festival',
    slug: 'songkran-water-festival',
    category: 'festival',
    description: 'Thailand water festival celebrated in April.',
    image_url: 'https://example.com/songkran.jpg',
    start_month: 4,
    end_month: 4,
    location: null,
    country: 'Thailand',
    region: 'Bangkok',
    scale: 5,
    crowd_level: 'busy',
    booking_destination_id: null,
    getyourguide_location_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildEventJsonLd', () => {
  it('has @context schema.org and @type Event', () => {
    const result = buildEventJsonLd(makeEvent());
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('Event');
  });

  it('populates name, description, startDate, endDate from event data', () => {
    const result = buildEventJsonLd(makeEvent());
    expect(result.name).toBe('Songkran Water Festival');
    expect(result.description).toBe(
      'Thailand water festival celebrated in April.',
    );
    expect(result.startDate).toMatch(/^\d{4}-04-01$/);
    expect(result.endDate).toMatch(/^\d{4}-04-28$/);
  });

  it('location has @type Place with address', () => {
    const result = buildEventJsonLd(makeEvent());
    const location = result.location as Record<string, unknown>;
    expect(location['@type']).toBe('Place');

    const address = location.address as Record<string, unknown>;
    expect(address['@type']).toBe('PostalAddress');
    expect(address.addressCountry).toBe('Thailand');
    expect(address.addressRegion).toBe('Bangkok');
  });

  it('prevents XSS: </script> in event name is escaped in stringified output', () => {
    const event = makeEvent({ name: 'Evil</script><script>alert(1)' });
    const result = buildEventJsonLd(event);
    const stringified = JSON.stringify(result).replace(/</g, '\\u003c');
    expect(stringified).not.toContain('</script>');
    expect(stringified).toContain('\\u003c');
  });

  it('falls back to "Discover {name}" when description is null', () => {
    const result = buildEventJsonLd(makeEvent({ description: null }));
    expect(result.description).toBe('Discover Songkran Water Festival');
  });

  it('includes image when image_url is present', () => {
    const result = buildEventJsonLd(makeEvent());
    expect(result.image).toBe('https://example.com/songkran.jpg');
  });

  it('omits image when image_url is null', () => {
    const result = buildEventJsonLd(makeEvent({ image_url: null }));
    expect(result).not.toHaveProperty('image');
  });
});
