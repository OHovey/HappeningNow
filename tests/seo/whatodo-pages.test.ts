import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PAGE_PATH = path.resolve(__dirname, '../../src/app/what-to-do/[destination]/[month]/page.tsx');

describe('what-to-do programmatic SEO pages', () => {
  let pageSource: string;

  beforeAll(() => {
    pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');
  });

  describe('ISR configuration', () => {
    it('exports revalidate = 86400', () => {
      expect(pageSource).toMatch(/export\s+const\s+revalidate\s*=\s*86400/);
    });

    it('exports dynamicParams = true', () => {
      expect(pageSource).toMatch(/export\s+const\s+dynamicParams\s*=\s*true/);
    });

    it('exports generateStaticParams that returns empty array', () => {
      expect(pageSource).toMatch(/export\s+async\s+function\s+generateStaticParams/);
      // Function body returns []
      expect(pageSource).toMatch(/generateStaticParams[\s\S]*?return\s+\[\]/);
    });
  });

  describe('weather and crowd utility imports', () => {
    it('imports formatWeatherSummary from destination-utils', () => {
      expect(pageSource).toContain('formatWeatherSummary');
      expect(pageSource).toContain('@/lib/destination-utils');
    });

    it('imports formatTemperature from destination-utils', () => {
      expect(pageSource).toContain('formatTemperature');
    });

    it('imports crowdScoreToColor from crowd-colors', () => {
      expect(pageSource).toContain('crowdScoreToColor');
      expect(pageSource).toContain('@/lib/crowd-colors');
    });

    it('imports crowdScoreToLabel from crowd-colors', () => {
      expect(pageSource).toContain('crowdScoreToLabel');
    });

    it('imports estimateTouristVolume from crowd-colors', () => {
      expect(pageSource).toContain('estimateTouristVolume');
    });
  });

  describe('noindex logic for what-to-do pages', () => {
    it('imports shouldNoindex for thin page detection', () => {
      expect(pageSource).toContain('shouldNoindex');
      expect(pageSource).toContain('@/lib/seo/thin-page-check');
    });

    it('passes weather and crowd data to shouldNoindex', () => {
      // shouldNoindex is called with hasWeatherData and hasCrowdData
      expect(pageSource).toMatch(/shouldNoindex\(\s*events\.length\s*,\s*hasWeatherData\s*,\s*hasCrowdData\s*\)/);
    });

    it('noindex only when destination has no supplementary data', () => {
      // The page keeps indexed when weather+crowd exist (even with 0 events)
      // by passing hasWeatherData and hasCrowdData to shouldNoindex
      expect(pageSource).toContain('hasWeatherData');
      expect(pageSource).toContain('hasCrowdData');
    });
  });

  describe('metadata generation', () => {
    it('exports generateMetadata function', () => {
      expect(pageSource).toMatch(/export\s+async\s+function\s+generateMetadata/);
    });

    it('generates canonical URL with numeric month', () => {
      expect(pageSource).toContain('what-to-do/${destinationSlug}/${month}');
    });

    it('title includes destination name and month name', () => {
      expect(pageSource).toContain('What to Do in ${destination.name} in ${monthName}');
    });
  });

  describe('page structure', () => {
    it('uses SeoPageLayout wrapper', () => {
      expect(pageSource).toContain('SeoPageLayout');
    });

    it('includes weather section with data-section attribute', () => {
      expect(pageSource).toContain('data-section="weather"');
    });

    it('includes events section with data-section attribute', () => {
      expect(pageSource).toContain('data-section="events"');
    });

    it('includes booking section with data-section attribute', () => {
      expect(pageSource).toContain('data-section="booking"');
    });

    it('renders FilteredMap for events', () => {
      expect(pageSource).toContain('FilteredMap');
    });

    it('renders EventCardGrid', () => {
      expect(pageSource).toContain('EventCardGrid');
    });

    it('includes FtcDisclosure', () => {
      expect(pageSource).toContain('FtcDisclosure');
    });

    it('includes Booking.com CTA', () => {
      expect(pageSource).toContain('Book on Booking.com');
    });

    it('includes GetYourGuide CTA', () => {
      expect(pageSource).toContain('Find Tours on GetYourGuide');
    });
  });
});
