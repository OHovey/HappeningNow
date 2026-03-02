import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';

/**
 * Tests for robots.txt generation via Next.js robots.ts convention.
 *
 * Verifies the robots() function returns the correct rules and sitemap URL.
 */

describe('robots.ts', () => {
  const result = robots();

  it('allows all user agents', () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.userAgent).toBe('*');
  });

  it('allows root path', () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.allow).toContain('/');
  });

  it('disallows /api/ routes', () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
    expect(disallow).toContain('/api/');
  });

  it('references the correct sitemap URL', () => {
    const sitemapValue = Array.isArray(result.sitemap)
      ? result.sitemap[0]
      : result.sitemap;
    expect(sitemapValue).toBe('https://happeningnow.travel/sitemap.xml');
  });
});
