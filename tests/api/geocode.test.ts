import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/geocode/route';

const mockPhotonResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] },
      properties: { name: 'London', country: 'United Kingdom', countrycode: 'GB' },
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/geocode', () => {
  it('returns features for valid query', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPhotonResponse),
    }));

    const request = new Request('http://localhost/api/geocode?q=london');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.features).toHaveLength(1);
    expect(data.features[0].properties.name).toBe('London');
  });

  it('returns empty array for query shorter than 2 chars', async () => {
    const request = new Request('http://localhost/api/geocode?q=l');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.features).toEqual([]);
  });

  it('returns empty array when q is missing', async () => {
    const request = new Request('http://localhost/api/geocode');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.features).toEqual([]);
  });

  it('returns 502 on Photon failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    // Use unique query to avoid in-memory cache from previous test
    const request = new Request('http://localhost/api/geocode?q=failcity');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.features).toEqual([]);
  });

  it('returns 502 on fetch network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    // Use unique query to avoid in-memory cache
    const request = new Request('http://localhost/api/geocode?q=networkerr');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.features).toEqual([]);
  });
});
