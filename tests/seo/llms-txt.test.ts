import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structural tests for llms.txt and llms-full.txt route handlers.
 *
 * Verifies exports, content structure, URL patterns, and affiliate link
 * inclusion by reading the source files directly (same pattern as other
 * SEO tests in the codebase).
 */

const LLMS_TXT_PATH = path.resolve(
  __dirname,
  '../../src/app/llms.txt/route.ts',
);
const LLMS_FULL_PATH = path.resolve(
  __dirname,
  '../../src/app/llms-full.txt/route.ts',
);

const llmsTxtSource = fs.readFileSync(LLMS_TXT_PATH, 'utf-8');
const llmsFullSource = fs.readFileSync(LLMS_FULL_PATH, 'utf-8');

describe('llms.txt route handler', () => {
  describe('exports', () => {
    it('exports revalidate = 86400', () => {
      expect(llmsTxtSource).toMatch(/export\s+const\s+revalidate\s*=\s*86400/);
    });

    it('exports GET function', () => {
      expect(llmsTxtSource).toMatch(/export\s+async\s+function\s+GET/);
    });
  });

  describe('content structure', () => {
    it('includes HappeningNow.travel header', () => {
      expect(llmsTxtSource).toContain('# HappeningNow.travel');
    });

    it('includes Regions Covered section', () => {
      expect(llmsTxtSource).toContain('## Regions Covered');
    });

    it('includes Countries Covered section', () => {
      expect(llmsTxtSource).toContain('## Countries Covered');
    });

    it('includes Wildlife Species section', () => {
      expect(llmsTxtSource).toContain('## Wildlife Species');
    });

    it('includes Page Types section', () => {
      expect(llmsTxtSource).toContain('## Page Types');
    });

    it('includes link to llms-full.txt', () => {
      expect(llmsTxtSource).toContain('llms-full.txt');
    });

    it('uses correct region URL pattern with slugify', () => {
      expect(llmsTxtSource).toMatch(/\/festivals\/\$\{slugify\(region\)\}/);
    });

    it('uses correct country URL pattern with slugify', () => {
      expect(llmsTxtSource).toMatch(/\/festivals\/\$\{slugify\(country\)\}/);
    });

    it('uses correct wildlife URL pattern with slugify', () => {
      expect(llmsTxtSource).toMatch(/\/wildlife\/\$\{slugify\(s\)\}/);
    });
  });

  describe('response format', () => {
    it('returns Response with text/markdown content type', () => {
      expect(llmsTxtSource).toContain("'Content-Type': 'text/markdown; charset=utf-8'");
    });

    it('sets Cache-Control header for 24 hours', () => {
      expect(llmsTxtSource).toContain("'Cache-Control': 'public, max-age=86400'");
    });
  });
});

describe('llms-full.txt route handler', () => {
  describe('exports', () => {
    it('exports revalidate = 86400', () => {
      expect(llmsFullSource).toMatch(/export\s+const\s+revalidate\s*=\s*86400/);
    });

    it('exports GET function', () => {
      expect(llmsFullSource).toMatch(/export\s+async\s+function\s+GET/);
    });
  });

  describe('content sections', () => {
    it('includes Festivals section', () => {
      expect(llmsFullSource).toContain("'## Festivals'");
    });

    it('includes Wildlife Viewing section', () => {
      expect(llmsFullSource).toContain("'## Wildlife Viewing'");
    });

    it('includes Migration Routes section', () => {
      expect(llmsFullSource).toContain("'## Migration Routes'");
    });

    it('includes Destinations section', () => {
      expect(llmsFullSource).toContain("'## Destinations'");
    });
  });

  describe('affiliate links', () => {
    it('uses buildBookingLink for festival entries', () => {
      // Check that festivals section uses buildBookingLink
      expect(llmsFullSource).toContain('buildBookingLink');
      // Verify it is called with festival data
      expect(llmsFullSource).toMatch(/buildBookingLink\(\{[\s\S]*?destinationId:\s*fest\.booking_destination_id/);
    });

    it('uses buildGetYourGuideLink for festival entries', () => {
      expect(llmsFullSource).toContain('buildGetYourGuideLink');
      expect(llmsFullSource).toMatch(/buildGetYourGuideLink\(\{[\s\S]*?locationId:\s*fest\.getyourguide_location_id/);
    });

    it('uses buildGetYourGuideLink for wildlife entries', () => {
      expect(llmsFullSource).toMatch(/buildGetYourGuideLink\(\{[\s\S]*?locationId:\s*w\.getyourguide_location_id/);
    });

    it('does NOT use buildBookingLink for wildlife entries', () => {
      // Wildlife section should not have booking links
      // The wildlife loop uses 'w' variable, festival uses 'fest'
      // Verify no buildBookingLink call uses 'w.' prefix variables
      const wildlifeSection = llmsFullSource.split("'## Wildlife Viewing'")[1]?.split("'## Migration Routes'")[0] ?? '';
      expect(wildlifeSection).not.toContain('buildBookingLink');
    });

    it('uses buildBookingLink for destination entries', () => {
      const destSection = llmsFullSource.split("'## Destinations'")[1] ?? '';
      expect(destSection).toContain('buildBookingLink');
    });
  });

  describe('event detail URLs', () => {
    it('links to /event/{slug} for festival detail pages', () => {
      expect(llmsFullSource).toMatch(/\/event\/\$\{fest\.slug\}/);
    });

    it('links to /event/{slug} for wildlife detail pages', () => {
      expect(llmsFullSource).toMatch(/\/event\/\$\{w\.slug\}/);
    });

    it('links to /what-to-do/{slug} for destination pages', () => {
      expect(llmsFullSource).toMatch(/\/what-to-do\/\$\{dest\.slug\}/);
    });
  });

  describe('response format', () => {
    it('returns Response with text/markdown content type', () => {
      expect(llmsFullSource).toContain("'Content-Type': 'text/markdown; charset=utf-8'");
    });

    it('sets Cache-Control header for 24 hours', () => {
      expect(llmsFullSource).toContain("'Cache-Control': 'public, max-age=86400'");
    });
  });
});
