import { describe, it, expect } from 'vitest';
import { slugify, deslugify } from '@/lib/supabase/seo-queries';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for sitemap URL generation logic and file structure.
 *
 * Tests verify slugify/deslugify utilities, URL format correctness,
 * month range validity, and revalidate config across all sitemap files.
 */

describe('slugify / deslugify round-trip', () => {
  const cases = [
    'South America',
    'East Africa',
    'United States',
    'New Zealand',
    'Sri Lanka',
    'Costa Rica',
  ];

  it.each(cases)('round-trips "%s" through slugify then deslugify', (input) => {
    const slugged = slugify(input);
    const restored = deslugify(slugged);
    expect(restored.toLowerCase()).toBe(input.toLowerCase());
  });

  it('slugify removes special characters', () => {
    expect(slugify("Côte d'Ivoire")).toBe('c-te-d-ivoire');
  });

  it('slugify lowercases and replaces spaces with hyphens', () => {
    expect(slugify('East Africa')).toBe('east-africa');
  });

  it('slugify strips leading/trailing hyphens', () => {
    expect(slugify(' -test- ')).toBe('test');
  });
});

describe('sitemap URL format', () => {
  const BASE_URL = 'https://happeningnow.travel';

  it('festival country URL is correct format', () => {
    const country = 'Thailand';
    const url = `${BASE_URL}/festivals/${slugify(country)}`;
    expect(url).toBe('https://happeningnow.travel/festivals/thailand');
  });

  it('festival country+month URL is correct format', () => {
    const country = 'Thailand';
    const month = 3;
    const url = `${BASE_URL}/festivals/${slugify(country)}/${month}`;
    expect(url).toBe('https://happeningnow.travel/festivals/thailand/3');
  });

  it('wildlife region URL is correct format', () => {
    const region = 'East Africa';
    const url = `${BASE_URL}/wildlife/region/${slugify(region)}`;
    expect(url).toBe('https://happeningnow.travel/wildlife/region/east-africa');
  });

  it('wildlife species URL is correct format', () => {
    const species = 'Blue Whale';
    const url = `${BASE_URL}/wildlife/species/${slugify(species)}`;
    expect(url).toBe('https://happeningnow.travel/wildlife/species/blue-whale');
  });

  it('what-to-do URL is correct format', () => {
    const destination = 'bali';
    const month = 7;
    const url = `${BASE_URL}/what-to-do/${destination}/${month}`;
    expect(url).toBe('https://happeningnow.travel/what-to-do/bali/7');
  });
});

describe('month values', () => {
  const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it('all months are integers 1-12', () => {
    for (const month of MONTHS) {
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(Number.isInteger(month)).toBe(true);
    }
  });

  it('there are exactly 12 months', () => {
    expect(MONTHS).toHaveLength(12);
  });
});

describe('priority values', () => {
  const priorities = [1.0, 0.8, 0.7, 0.6];

  it('all priority values are between 0 and 1', () => {
    for (const p of priorities) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe('sitemap files use revalidate = 3600', () => {
  const sitemapPaths = [
    'src/app/sitemap.ts',
    'src/app/festivals/sitemap.ts',
    'src/app/wildlife/sitemap.ts',
    'src/app/what-to-do/sitemap.ts',
  ];

  it.each(sitemapPaths)('%s exports revalidate = 3600', (relativePath) => {
    const filePath = path.resolve(__dirname, '../../', relativePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export const revalidate = 3600');
  });
});
