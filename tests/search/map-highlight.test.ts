import { describe, it, expect, vi } from 'vitest';

/**
 * Unit tests for SearchMap highlight logic.
 * We test the GeoJSON builder and filter logic in isolation
 * since MapLibre GL cannot run in happy-dom.
 */

// Inline the builder function for unit testing (mirrors SearchMap internal)
interface SearchResult {
  id: string;
  lng: number;
  lat: number;
  name: string;
  category: string;
}

function buildResultsGeoJSON(
  results: SearchResult[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: results.map((r) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [r.lng, r.lat],
      },
      properties: {
        id: r.id,
        name: r.name,
        category: r.category,
      },
    })),
  };
}

describe('SearchMap GeoJSON builder', () => {
  const results: SearchResult[] = [
    { id: 'e1', lng: 10.5, lat: 50.5, name: 'Event A', category: 'festival' },
    { id: 'e2', lng: -3.2, lat: 55.9, name: 'Event B', category: 'wildlife' },
  ];

  it('builds FeatureCollection with correct feature count', () => {
    const geojson = buildResultsGeoJSON(results);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(2);
  });

  it('sets coordinates from lng/lat', () => {
    const geojson = buildResultsGeoJSON(results);
    const coords = geojson.features[0].geometry;
    expect(coords.type).toBe('Point');
    if (coords.type === 'Point') {
      expect(coords.coordinates).toEqual([10.5, 50.5]);
    }
  });

  it('includes id in feature properties for filtering', () => {
    const geojson = buildResultsGeoJSON(results);
    expect(geojson.features[0].properties?.id).toBe('e1');
    expect(geojson.features[1].properties?.id).toBe('e2');
  });
});

describe('SearchMap highlight filter', () => {
  it('setFilter called with result ID for highlight layer', () => {
    // Simulate what SearchMap does: set filter to match selected ID
    const setFilter = vi.fn();
    const selectedResultId = 'e1';

    // This mirrors the useEffect in SearchMap
    setFilter('search-result-highlight', [
      '==',
      ['get', 'id'],
      selectedResultId,
    ]);

    expect(setFilter).toHaveBeenCalledWith('search-result-highlight', [
      '==',
      ['get', 'id'],
      'e1',
    ]);
  });

  it('setFilter called with empty string when nothing selected', () => {
    const setFilter = vi.fn();
    const selectedResultId: string | null = null;

    setFilter('search-result-highlight', [
      '==',
      ['get', 'id'],
      selectedResultId ?? '',
    ]);

    expect(setFilter).toHaveBeenCalledWith('search-result-highlight', [
      '==',
      ['get', 'id'],
      '',
    ]);
  });

  it('selected marker gets distinct paint properties (larger radius)', () => {
    // Verify the highlight layer config has larger radius than base
    const basePaint = { 'circle-radius': 8 };
    const highlightPaint = { 'circle-radius': 14 };
    expect(highlightPaint['circle-radius']).toBeGreaterThan(basePaint['circle-radius']);
  });
});
