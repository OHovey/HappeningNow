import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildBookingLink, buildGetYourGuideLink, formatMonthRange } from '@/lib/affiliates';

describe('buildBookingLink', () => {
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

  it('handles missing env var gracefully (no crash, no aid param)', () => {
    vi.stubEnv('NEXT_PUBLIC_BOOKING_AFFILIATE_ID', '');

    const url = buildBookingLink({ city: 'London' });

    expect(url).toContain('booking.com/searchresults.html');
    expect(url).not.toContain('aid=');
    expect(url).toContain('ss=London');
  });

  describe('date safety', () => {
    it('computes checkin from startMonth in the future', () => {
      // Use a month that's definitely in the future relative to test execution
      const futureMonth = ((new Date().getMonth() + 3) % 12) + 1; // 3 months ahead
      const url = buildBookingLink({
        city: 'Tokyo',
        startMonth: futureMonth,
      });

      const checkinMatch = url.match(/checkin=(\d{4}-\d{2}-\d{2})/);
      expect(checkinMatch).not.toBeNull();

      const checkinDate = new Date(checkinMatch![1] + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Checkin must be in the future (or today)
      expect(checkinDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
    });

    it('uses next year when startMonth is in the past', () => {
      // Use a month that's definitely in the past for current year
      const pastMonth = new Date().getMonth(); // 0-indexed, so this month - 1 as 1-indexed
      // If we're in January, all months except 1 are "in the future"
      // So let's pick a month guaranteed to be past: last month
      const lastMonth = pastMonth === 0 ? 12 : pastMonth; // 1-indexed last month

      const url = buildBookingLink({
        city: 'Berlin',
        startMonth: lastMonth,
      });

      const checkinMatch = url.match(/checkin=(\d{4}-\d{2}-\d{2})/);
      expect(checkinMatch).not.toBeNull();

      const checkinDate = new Date(checkinMatch![1] + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // The date must be in the future
      expect(checkinDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
    });

    it('clamps checkin to max 500 days from today', () => {
      // Use a month far enough in the future that next-year logic kicks in
      // and the result might exceed 500 days
      const url = buildBookingLink({
        city: 'Sydney',
        startMonth: new Date().getMonth() + 1 || 12, // current month
      });

      const checkinMatch = url.match(/checkin=(\d{4}-\d{2}-\d{2})/);
      expect(checkinMatch).not.toBeNull();

      const checkinDate = new Date(checkinMatch![1] + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 500);

      expect(checkinDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
    });

    it('sets checkout to checkin + 7 days', () => {
      const url = buildBookingLink({
        city: 'Paris',
        checkin: '2026-08-01',
      });

      expect(url).toContain('checkout=2026-08-08');
    });

    it('computes checkout from derived checkin', () => {
      const futureMonth = ((new Date().getMonth() + 3) % 12) + 1;
      const url = buildBookingLink({
        city: 'Rome',
        startMonth: futureMonth,
      });

      const checkinMatch = url.match(/checkin=(\d{4}-\d{2}-\d{2})/);
      const checkoutMatch = url.match(/checkout=(\d{4}-\d{2}-\d{2})/);
      expect(checkinMatch).not.toBeNull();
      expect(checkoutMatch).not.toBeNull();

      const checkinDate = new Date(checkinMatch![1] + 'T00:00:00');
      const checkoutDate = new Date(checkoutMatch![1] + 'T00:00:00');
      const diffDays = Math.round(
        (checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBe(7);
    });
  });

  describe('destination fallback', () => {
    it('uses dest_id and dest_type when destinationId provided', () => {
      const url = buildBookingLink({
        destinationId: '-2140479',
        checkin: '2026-06-01',
        checkout: '2026-06-08',
      });

      expect(url).toContain('dest_id=-2140479');
      expect(url).toContain('dest_type=city');
      expect(url).not.toContain('ss=');
    });

    it('falls back to ss param with city name when no destinationId', () => {
      const url = buildBookingLink({
        city: 'Marrakech',
        checkin: '2026-06-01',
        checkout: '2026-06-08',
      });

      expect(url).toContain('ss=Marrakech');
      expect(url).not.toContain('dest_id');
      expect(url).not.toContain('dest_type');
    });
  });

  describe('Awin wrapping', () => {
    it('wraps through awin1.com when Awin params provided', () => {
      const url = buildBookingLink({
        city: 'London',
        checkin: '2026-06-01',
        checkout: '2026-06-08',
        awinAffiliateId: '12345',
        awinMerchantId: '67890',
      });

      expect(url).toContain('https://www.awin1.com/cread.php');
      expect(url).toContain('awinmid=67890');
      expect(url).toContain('awinaffid=12345');
      expect(url).toContain('ued=');
      // The wrapped URL should contain the booking.com URL (encoded)
      expect(url).toContain(encodeURIComponent('booking.com'));
    });

    it('uses direct Booking.com URL when Awin params not provided', () => {
      const url = buildBookingLink({
        city: 'London',
        checkin: '2026-06-01',
        checkout: '2026-06-08',
      });

      expect(url).toContain('https://www.booking.com/searchresults.html');
      expect(url).not.toContain('awin1.com');
    });

    it('uses direct Booking.com URL when only one Awin param provided', () => {
      const url = buildBookingLink({
        city: 'London',
        checkin: '2026-06-01',
        checkout: '2026-06-08',
        awinAffiliateId: '12345',
        // awinMerchantId missing
      });

      expect(url).toContain('https://www.booking.com/searchresults.html');
      expect(url).not.toContain('awin1.com');
    });
  });
});

describe('buildGetYourGuideLink', () => {
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
