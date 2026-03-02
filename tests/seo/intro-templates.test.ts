import { describe, it, expect } from 'vitest';
import {
  simpleHash,
  FESTIVAL_REGION_MONTH_TEMPLATES,
  FESTIVAL_COUNTRY_TEMPLATES,
  FESTIVAL_COUNTRY_MONTH_TEMPLATES,
  WILDLIFE_REGION_TEMPLATES,
  WILDLIFE_SPECIES_TEMPLATES,
  WILDLIFE_REGION_MONTH_TEMPLATES,
  WHATODO_TEMPLATES,
  getFestivalRegionMonthIntro,
  getFestivalCountryIntro,
  getFestivalCountryMonthIntro,
  getWildlifeRegionIntro,
  getWildlifeSpeciesIntro,
  getWildlifeRegionMonthIntro,
  getWhatToDoIntro,
} from '@/lib/seo/intro-templates';

describe('intro-templates', () => {
  describe('template count >= 20 per page type', () => {
    it('FESTIVAL_REGION_MONTH_TEMPLATES has >= 20 entries', () => {
      expect(FESTIVAL_REGION_MONTH_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('FESTIVAL_COUNTRY_TEMPLATES has >= 20 entries', () => {
      expect(FESTIVAL_COUNTRY_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('FESTIVAL_COUNTRY_MONTH_TEMPLATES has >= 20 entries', () => {
      expect(FESTIVAL_COUNTRY_MONTH_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('WILDLIFE_REGION_TEMPLATES has >= 20 entries', () => {
      expect(WILDLIFE_REGION_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('WILDLIFE_SPECIES_TEMPLATES has >= 20 entries', () => {
      expect(WILDLIFE_SPECIES_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('WILDLIFE_REGION_MONTH_TEMPLATES has >= 20 entries', () => {
      expect(WILDLIFE_REGION_MONTH_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });

    it('WHATODO_TEMPLATES has >= 20 entries', () => {
      expect(WHATODO_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('deterministic selection', () => {
    it('same input always produces same output for festival region month', () => {
      const a = getFestivalRegionMonthIntro(5, 'Southeast Asia', 'March');
      const b = getFestivalRegionMonthIntro(5, 'Southeast Asia', 'March');
      expect(a).toBe(b);
    });

    it('same input always produces same output for festival country', () => {
      const a = getFestivalCountryIntro(10, 'Thailand', ['music', 'water']);
      const b = getFestivalCountryIntro(10, 'Thailand', ['music', 'water']);
      expect(a).toBe(b);
    });

    it('same input always produces same output for festival country month', () => {
      const a = getFestivalCountryMonthIntro(3, 'Japan', 'April', ['cherry blossom']);
      const b = getFestivalCountryMonthIntro(3, 'Japan', 'April', ['cherry blossom']);
      expect(a).toBe(b);
    });

    it('same input always produces same output for wildlife region', () => {
      const a = getWildlifeRegionIntro(8, 'East Africa', ['wildebeest', 'zebra']);
      const b = getWildlifeRegionIntro(8, 'East Africa', ['wildebeest', 'zebra']);
      expect(a).toBe(b);
    });

    it('same input always produces same output for wildlife species', () => {
      const a = getWildlifeSpeciesIntro(4, 'Humpback Whale', ['Pacific', 'Atlantic']);
      const b = getWildlifeSpeciesIntro(4, 'Humpback Whale', ['Pacific', 'Atlantic']);
      expect(a).toBe(b);
    });

    it('same input always produces same output for wildlife region month', () => {
      const a = getWildlifeRegionMonthIntro(6, 'Southern Africa', 'July', ['sardine']);
      const b = getWildlifeRegionMonthIntro(6, 'Southern Africa', 'July', ['sardine']);
      expect(a).toBe(b);
    });

    it('same input always produces same output for what-to-do', () => {
      const a = getWhatToDoIntro(12, 'Bangkok', 'March', 'moderate', '32C, 2 rain days');
      const b = getWhatToDoIntro(12, 'Bangkok', 'March', 'moderate', '32C, 2 rain days');
      expect(a).toBe(b);
    });
  });

  describe('different inputs produce different outputs', () => {
    it('different regions produce different festival intros', () => {
      const a = getFestivalRegionMonthIntro(5, 'Southeast Asia', 'March');
      const b = getFestivalRegionMonthIntro(5, 'Europe', 'March');
      // Different inputs should usually produce different output
      // (not guaranteed for all pairs, but should differ for most)
      // We test several pairs to be confident
      const c = getFestivalRegionMonthIntro(5, 'South America', 'March');
      const results = new Set([a, b, c]);
      expect(results.size).toBeGreaterThanOrEqual(2);
    });

    it('different months produce different what-to-do intros', () => {
      const a = getWhatToDoIntro(10, 'Bangkok', 'January', 'busy', '30C');
      const b = getWhatToDoIntro(10, 'Bangkok', 'July', 'quiet', '28C');
      // Content differs because template varies and data differs
      expect(a).not.toBe(b);
    });
  });

  describe('all templates return non-empty strings', () => {
    it('all festival region month templates return non-empty', () => {
      for (const fn of FESTIVAL_REGION_MONTH_TEMPLATES) {
        const result = fn(5, 'Test Region', 'March');
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all festival country templates return non-empty', () => {
      for (const fn of FESTIVAL_COUNTRY_TEMPLATES) {
        const result = fn(5, 'Test Country', ['music']);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all festival country month templates return non-empty', () => {
      for (const fn of FESTIVAL_COUNTRY_MONTH_TEMPLATES) {
        const result = fn(5, 'Test Country', 'March', ['music']);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all wildlife region templates return non-empty', () => {
      for (const fn of WILDLIFE_REGION_TEMPLATES) {
        const result = fn(5, 'Test Region', ['eagle']);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all wildlife species templates return non-empty', () => {
      for (const fn of WILDLIFE_SPECIES_TEMPLATES) {
        const result = fn(5, 'Eagle', ['North America']);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all wildlife region month templates return non-empty', () => {
      for (const fn of WILDLIFE_REGION_MONTH_TEMPLATES) {
        const result = fn(5, 'Test Region', 'March', ['eagle']);
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });

    it('all what-to-do templates return non-empty', () => {
      for (const fn of WHATODO_TEMPLATES) {
        const result = fn(10, 'Bangkok', 'March', 'moderate', '32C');
        expect(result).toBeTruthy();
        expect(result.length).toBeGreaterThan(10);
      }
    });
  });

  describe('simpleHash', () => {
    it('is deterministic', () => {
      expect(simpleHash('test')).toBe(simpleHash('test'));
    });

    it('returns non-negative', () => {
      expect(simpleHash('any string')).toBeGreaterThanOrEqual(0);
      expect(simpleHash('')).toBeGreaterThanOrEqual(0);
    });

    it('different strings usually produce different hashes', () => {
      const a = simpleHash('hello');
      const b = simpleHash('world');
      expect(a).not.toBe(b);
    });
  });
});
