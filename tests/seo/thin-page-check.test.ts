import { describe, it, expect } from 'vitest';
import { shouldNoindex, THIN_PAGE_THRESHOLD } from '@/lib/seo/thin-page-check';

describe('thin-page-check', () => {
  describe('shouldNoindex', () => {
    it('returns true for 0 events without supplementary data', () => {
      expect(shouldNoindex(0)).toBe(true);
    });

    it('returns true for 1 event without supplementary data', () => {
      expect(shouldNoindex(1)).toBe(true);
    });

    it('returns true for 2 events without supplementary data', () => {
      expect(shouldNoindex(2)).toBe(true);
    });

    it('returns false for 3 events (at threshold)', () => {
      expect(shouldNoindex(3)).toBe(false);
    });

    it('returns false for events above threshold', () => {
      expect(shouldNoindex(5)).toBe(false);
      expect(shouldNoindex(10)).toBe(false);
      expect(shouldNoindex(100)).toBe(false);
    });

    it('returns true for 1 event with only weather data', () => {
      expect(shouldNoindex(1, true, false)).toBe(true);
    });

    it('returns true for 1 event with only crowd data', () => {
      expect(shouldNoindex(1, false, true)).toBe(true);
    });

    it('returns false for 1 event with BOTH weather and crowd data', () => {
      expect(shouldNoindex(1, true, true)).toBe(false);
    });

    it('returns false for 2 events with both weather and crowd data', () => {
      expect(shouldNoindex(2, true, true)).toBe(false);
    });

    it('returns false for 0 events with both weather and crowd data', () => {
      // Even 0 events, if we have both supplementary data, the page is useful
      expect(shouldNoindex(0, true, true)).toBe(false);
    });

    it('returns false for 3+ events regardless of supplementary data', () => {
      expect(shouldNoindex(3, false, false)).toBe(false);
      expect(shouldNoindex(5, true, true)).toBe(false);
    });
  });

  describe('THIN_PAGE_THRESHOLD', () => {
    it('is set to 3', () => {
      expect(THIN_PAGE_THRESHOLD).toBe(3);
    });
  });
});
