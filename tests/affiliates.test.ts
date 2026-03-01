import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildBookingLink, buildGetYourGuideLink, formatMonthRange } from '@/lib/affiliates';

describe('buildBookingLink', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_BOOKING_AFFILIATE_ID', 'test-aid-123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds URL with full params (destinationId, checkin, checkout)', () => {
    const url = buildBookingLink({
      destinationId: '-2140479',
      checkin: '2026-06-01',
      checkout: '2026-06-15',
    });

    expect(url).toContain('booking.com/searchresults.html');
    expect(url).toContain('aid=test-aid-123');
    expect(url).toContain('dest_id=-2140479');
    expect(url).toContain('dest_type=city');
    expect(url).toContain('checkin=2026-06-01');
    expect(url).toContain('checkout=2026-06-15');
    expect(url).toContain('no_rooms=1');
    expect(url).toContain('group_adults=2');
  });

  it('uses city name as ss param when no destinationId', () => {
    const url = buildBookingLink({
      city: 'Barcelona',
      checkin: '2026-03-01',
      checkout: '2026-03-07',
    });

    expect(url).toContain('ss=Barcelona');
    expect(url).not.toContain('dest_id');
  });

  it('derives dates from startMonth when no checkin/checkout', () => {
    const url = buildBookingLink({
      city: 'Tokyo',
      startMonth: 3,
    });

    const year = new Date().getFullYear();
    expect(url).toContain(`checkin=${year}-03-01`);
    expect(url).toContain(`checkout=${year}-03-31`);
  });

  it('handles missing env var gracefully (no crash, no aid param)', () => {
    vi.stubEnv('NEXT_PUBLIC_BOOKING_AFFILIATE_ID', '');

    const url = buildBookingLink({ city: 'London' });

    expect(url).toContain('booking.com/searchresults.html');
    expect(url).not.toContain('aid=');
    expect(url).toContain('ss=London');
  });
});

describe('buildGetYourGuideLink', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GYG_PARTNER_ID', 'gyg-partner-456');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds URL with locationId', () => {
    const url = buildGetYourGuideLink({ locationId: '12345' });

    expect(url).toContain('getyourguide.com/l12345');
    expect(url).toContain('partner_id=gyg-partner-456');
  });

  it('builds search URL with query when no locationId', () => {
    const url = buildGetYourGuideLink({ query: 'Carnival Rio de Janeiro' });

    expect(url).toContain('getyourguide.com/s/');
    expect(url).toContain('q=Carnival+Rio+de+Janeiro');
    expect(url).toContain('partner_id=gyg-partner-456');
  });

  it('handles missing env var gracefully', () => {
    vi.stubEnv('NEXT_PUBLIC_GYG_PARTNER_ID', '');

    const url = buildGetYourGuideLink({ query: 'Safari Kenya' });

    expect(url).toContain('getyourguide.com/s/');
    expect(url).toContain('q=Safari+Kenya');
    expect(url).not.toContain('partner_id=');
  });
});

describe('formatMonthRange', () => {
  it('formats single month', () => {
    expect(formatMonthRange(3, 3)).toBe('March');
  });

  it('formats multi-month range', () => {
    expect(formatMonthRange(6, 8)).toBe('June - August');
  });

  it('formats year-boundary range', () => {
    expect(formatMonthRange(11, 2)).toBe('November - February');
  });
});
