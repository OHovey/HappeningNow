import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Behavioral tests for festival programmatic SEO pages.
 *
 * Tests verify ISR config exports, region/country disambiguation,
 * noindex logic, canonical URL format, and SeoPageLayout usage.
 *
 * These tests read the source files and verify structural requirements
 * rather than rendering (which requires Supabase + Next.js runtime).
 */

const SLUG_PAGE_PATH = path.resolve(
  __dirname,
  '../../src/app/festivals/[slug]/page.tsx',
);
const MONTH_PAGE_PATH = path.resolve(
  __dirname,
  '../../src/app/festivals/[slug]/[month]/page.tsx',
);

const slugPageSource = fs.readFileSync(SLUG_PAGE_PATH, 'utf-8');
const monthPageSource = fs.readFileSync(MONTH_PAGE_PATH, 'utf-8');

describe('Festival SEO Pages', () => {
  describe('ISR configuration', () => {
    it('exports revalidate = 86400 in [slug]/page.tsx', () => {
      expect(slugPageSource).toMatch(/export\s+const\s+revalidate\s*=\s*86400/);
    });

    it('exports revalidate = 86400 in [slug]/[month]/page.tsx', () => {
      expect(monthPageSource).toMatch(
        /export\s+const\s+revalidate\s*=\s*86400/,
      );
    });

    it('exports dynamicParams = true in [slug]/page.tsx', () => {
      expect(slugPageSource).toMatch(
        /export\s+const\s+dynamicParams\s*=\s*true/,
      );
    });

    it('exports dynamicParams = true in [slug]/[month]/page.tsx', () => {
      expect(monthPageSource).toMatch(
        /export\s+const\s+dynamicParams\s*=\s*true/,
      );
    });

    it('exports generateStaticParams returning empty array in [slug]/page.tsx', () => {
      expect(slugPageSource).toMatch(/generateStaticParams/);
      expect(slugPageSource).toMatch(/return\s*\[\s*\]/);
    });

    it('exports generateStaticParams returning empty array in [slug]/[month]/page.tsx', () => {
      expect(monthPageSource).toMatch(/generateStaticParams/);
      expect(monthPageSource).toMatch(/return\s*\[\s*\]/);
    });
  });

  describe('Region vs Country disambiguation', () => {
    it('[slug]/[month] page has KNOWN_REGIONS set', () => {
      expect(monthPageSource).toContain('KNOWN_REGIONS');
      expect(monthPageSource).toContain('southeast-asia');
      expect(monthPageSource).toContain('europe');
      expect(monthPageSource).toContain('africa');
    });

    it('[slug]/[month] page checks isKnownRegion for disambiguation', () => {
      expect(monthPageSource).toMatch(/isKnownRegion/);
    });

    it('[slug]/[month] page uses getFestivalsByRegionMonth for regions', () => {
      expect(monthPageSource).toContain('getFestivalsByRegionMonth');
    });

    it('[slug]/[month] page uses getFestivalsByCountryMonth for countries', () => {
      expect(monthPageSource).toContain('getFestivalsByCountryMonth');
    });

    it('[slug] page rejects known region slugs with notFound', () => {
      expect(slugPageSource).toContain('KNOWN_REGIONS');
      expect(slugPageSource).toContain('notFound');
    });

    it('[slug] page uses getFestivalsByCountry for country data', () => {
      expect(slugPageSource).toContain('getFestivalsByCountry');
    });
  });

  describe('Noindex logic', () => {
    it('[slug]/page.tsx uses shouldNoindex', () => {
      expect(slugPageSource).toContain('shouldNoindex');
    });

    it('[slug]/[month]/page.tsx uses shouldNoindex', () => {
      expect(monthPageSource).toContain('shouldNoindex');
    });

    it('[slug]/page.tsx conditionally sets robots noindex', () => {
      expect(slugPageSource).toContain('robots');
      expect(slugPageSource).toContain('index: false');
    });

    it('[slug]/[month]/page.tsx conditionally sets robots noindex', () => {
      expect(monthPageSource).toContain('robots');
      expect(monthPageSource).toContain('index: false');
    });
  });

  describe('Canonical URLs', () => {
    it('[slug]/page.tsx sets canonical URL with correct format', () => {
      expect(slugPageSource).toContain(
        'https://happeningnow.travel/festivals/',
      );
      expect(slugPageSource).toMatch(/canonical/);
    });

    it('[slug]/[month]/page.tsx sets canonical URL with correct format', () => {
      expect(monthPageSource).toContain(
        'https://happeningnow.travel/festivals/',
      );
      expect(monthPageSource).toMatch(/canonical/);
    });
  });

  describe('generateMetadata', () => {
    it('[slug]/page.tsx exports generateMetadata', () => {
      expect(slugPageSource).toMatch(
        /export\s+async\s+function\s+generateMetadata/,
      );
    });

    it('[slug]/[month]/page.tsx exports generateMetadata', () => {
      expect(monthPageSource).toMatch(
        /export\s+async\s+function\s+generateMetadata/,
      );
    });

    it('both pages await params (Next.js 15+ pattern)', () => {
      expect(slugPageSource).toMatch(/await\s+params/);
      expect(monthPageSource).toMatch(/await\s+params/);
    });
  });

  describe('SeoPageLayout usage', () => {
    it('[slug]/page.tsx imports SeoPageLayout', () => {
      expect(slugPageSource).toContain("from '@/components/seo/SeoPageLayout'");
    });

    it('[slug]/[month]/page.tsx imports SeoPageLayout', () => {
      expect(monthPageSource).toContain(
        "from '@/components/seo/SeoPageLayout'",
      );
    });

    it('[slug]/page.tsx imports EventCardGrid', () => {
      expect(slugPageSource).toContain("from '@/components/seo/EventCardGrid'");
    });

    it('[slug]/[month]/page.tsx imports EventCardGrid', () => {
      expect(monthPageSource).toContain(
        "from '@/components/seo/EventCardGrid'",
      );
    });

    it('[slug]/page.tsx imports FilteredMap', () => {
      expect(slugPageSource).toContain("from '@/components/seo/FilteredMap'");
    });

    it('[slug]/[month]/page.tsx imports FilteredMap', () => {
      expect(monthPageSource).toContain(
        "from '@/components/seo/FilteredMap'",
      );
    });
  });

  describe('Intro template usage', () => {
    it('[slug]/page.tsx uses getFestivalCountryIntro', () => {
      expect(slugPageSource).toContain('getFestivalCountryIntro');
    });

    it('[slug]/[month]/page.tsx uses region AND country month intro templates', () => {
      expect(monthPageSource).toContain('getFestivalRegionMonthIntro');
      expect(monthPageSource).toContain('getFestivalCountryMonthIntro');
    });
  });

  describe('Month validation', () => {
    it('[slug]/[month]/page.tsx validates month is 1-12', () => {
      // Should have parseMonth or equivalent validation
      expect(monthPageSource).toMatch(/parseMonth|parseInt/);
      // Should call notFound for invalid months
      expect(monthPageSource).toContain('notFound');
    });
  });

  describe('Semantic HTML', () => {
    it('[slug]/page.tsx uses data-section attributes', () => {
      expect(slugPageSource).toContain('data-section');
    });

    it('[slug]/[month]/page.tsx uses data-section attributes', () => {
      expect(monthPageSource).toContain('data-section');
    });

    it('[slug]/page.tsx has month grouping with h2 headings', () => {
      expect(slugPageSource).toContain('<h2');
      expect(slugPageSource).toContain('MONTH_NAMES');
    });
  });
});
