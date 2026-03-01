import { describe, it, expect } from 'vitest';
import {
  filterGeoJSON,
  buildMonthFilter,
  buildCategoryFilter,
  getCurrentMonth,
} from '@/lib/map/filters';

/** Helper: create a mock GeoJSON FeatureCollection */
function mockFeatureCollection(
  features: Array<{
    start_month: number;
    end_month: number;
    category: string;
    name?: string;
  }>
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map((f, i) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [i * 10, i * 5] },
      properties: {
        id: `event-${i}`,
        name: f.name ?? `Event ${i}`,
        category: f.category,
        start_month: f.start_month,
        end_month: f.end_month,
        scale: 5,
      },
    })),
  };
}

describe('filterGeoJSON', () => {
  const testData = mockFeatureCollection([
    { start_month: 3, end_month: 5, category: 'festival', name: 'Spring Fest' },
    { start_month: 7, end_month: 9, category: 'wildlife', name: 'Whale Watch' },
    { start_month: 11, end_month: 2, category: 'festival', name: 'Winter Fest' },
    { start_month: 1, end_month: 12, category: 'wildlife', name: 'Year-round' },
    { start_month: 6, end_month: 6, category: 'festival', name: 'June Only' },
  ]);

  describe('month filtering', () => {
    it('returns events in range for a normal month span', () => {
      const result = filterGeoJSON(testData, 4, ['festival', 'wildlife']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).toContain('Spring Fest');
      expect(names).toContain('Year-round');
      expect(names).not.toContain('Whale Watch');
    });

    it('returns events for year-boundary wrap (Dec-Feb)', () => {
      const result = filterGeoJSON(testData, 1, ['festival', 'wildlife']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).toContain('Winter Fest');
      expect(names).toContain('Year-round');
      expect(names).not.toContain('Spring Fest');
    });

    it('handles the start month of a year-boundary event', () => {
      const result = filterGeoJSON(testData, 11, ['festival', 'wildlife']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).toContain('Winter Fest');
    });

    it('handles the end month of a year-boundary event', () => {
      const result = filterGeoJSON(testData, 2, ['festival', 'wildlife']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).toContain('Winter Fest');
    });

    it('excludes events outside the year-boundary range', () => {
      const result = filterGeoJSON(testData, 6, ['festival', 'wildlife']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).not.toContain('Winter Fest');
    });

    it('returns events for single-month events', () => {
      const result = filterGeoJSON(testData, 6, ['festival']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).toContain('June Only');
    });

    it('excludes single-month events for other months', () => {
      const result = filterGeoJSON(testData, 5, ['festival']);
      const names = result.features.map((f) => f.properties?.name);
      expect(names).not.toContain('June Only');
    });
  });

  describe('category filtering', () => {
    it('filters to a single category', () => {
      const result = filterGeoJSON(testData, 4, ['festival']);
      expect(result.features.every((f) => f.properties?.category === 'festival')).toBe(true);
    });

    it('filters to multiple categories', () => {
      const result = filterGeoJSON(testData, 8, ['festival', 'wildlife']);
      const categories = result.features.map((f) => f.properties?.category);
      expect(categories).toContain('wildlife');
    });

    it('returns empty when no categories match', () => {
      const result = filterGeoJSON(testData, 4, []);
      expect(result.features).toHaveLength(0);
    });
  });

  describe('combined month + category filtering', () => {
    it('applies both month and category filters', () => {
      const result = filterGeoJSON(testData, 8, ['wildlife']);
      expect(result.features).toHaveLength(2); // Whale Watch + Year-round
      expect(result.features.every((f) => f.properties?.category === 'wildlife')).toBe(true);
    });

    it('returns empty when month matches but category does not', () => {
      const result = filterGeoJSON(testData, 4, ['wildlife']);
      // Only Year-round wildlife is active in April
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties?.name).toBe('Year-round');
    });
  });

  it('returns a FeatureCollection type', () => {
    const result = filterGeoJSON(testData, 1, ['festival']);
    expect(result.type).toBe('FeatureCollection');
    expect(Array.isArray(result.features)).toBe(true);
  });
});

describe('buildMonthFilter', () => {
  it('returns an array filter expression', () => {
    const filter = buildMonthFilter(6);
    expect(Array.isArray(filter)).toBe(true);
    expect(filter[0]).toBe('all');
  });
});

describe('buildCategoryFilter', () => {
  it('returns an in-expression filter', () => {
    const filter = buildCategoryFilter(['festival', 'wildlife']);
    expect(Array.isArray(filter)).toBe(true);
    expect(filter[0]).toBe('in');
  });
});

describe('getCurrentMonth', () => {
  it('returns a number between 1 and 12', () => {
    const month = getCurrentMonth();
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('returns the actual current month', () => {
    const expected = new Date().getMonth() + 1;
    expect(getCurrentMonth()).toBe(expected);
  });
});
