import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchQuerySchema } from '@/app/api/search/route';

// Mock Supabase before importing GET handler
const mockRpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}));

// Import GET after mocks are set up
const { GET } = await import('@/app/api/search/route');

const mockEvents = [
  {
    id: '1',
    name: 'Test Festival',
    slug: 'test-festival',
    category: 'festival',
    description: 'A test event',
    image_url: null,
    start_month: 6,
    end_month: 8,
    lng: -0.1276,
    lat: 51.5074,
    country: 'United Kingdom',
    region: 'London',
    scale: 7,
    crowd_level: 'moderate',
    booking_destination_id: null,
    getyourguide_location_id: null,
    distance_meters: 15000,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('searchQuerySchema', () => {
  it('parses valid lat/lng', () => {
    const result = searchQuerySchema.safeParse({ lat: '51.5', lng: '-0.1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBeCloseTo(51.5);
      expect(result.data.lng).toBeCloseTo(-0.1);
      expect(result.data.radius).toBe(200000); // default
    }
  });

  it('rejects missing lat', () => {
    const result = searchQuerySchema.safeParse({ lng: '-0.1' });
    expect(result.success).toBe(false);
  });

  it('rejects missing lng', () => {
    const result = searchQuerySchema.safeParse({ lat: '51.5' });
    expect(result.success).toBe(false);
  });

  it('accepts optional month and category filters', () => {
    const result = searchQuerySchema.safeParse({
      lat: '51.5', lng: '-0.1', start_month: '3', end_month: '6', category: 'festival',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start_month).toBe(3);
      expect(result.data.end_month).toBe(6);
      expect(result.data.category).toBe('festival');
    }
  });
});

describe('GET /api/search', () => {
  it('returns events for valid lat/lng/radius params', async () => {
    mockRpc.mockResolvedValue({ data: mockEvents, error: null });

    const request = new Request('http://localhost/api/search?lat=51.5&lng=-0.1&radius=200000');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockEvents);
    expect(mockRpc).toHaveBeenCalledWith('search_events_nearby', {
      user_lat: 51.5,
      user_lng: -0.1,
      radius_meters: 200000,
      start_m: null,
      end_m: null,
      filter_category: null,
    });
  });

  it('returns 400 for missing required params', async () => {
    const request = new Request('http://localhost/api/search');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('passes category and month filters to RPC', async () => {
    mockRpc.mockResolvedValue({ data: mockEvents, error: null });

    const request = new Request(
      'http://localhost/api/search?lat=51.5&lng=-0.1&start_month=3&end_month=6&category=festival'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith('search_events_nearby', {
      user_lat: 51.5,
      user_lng: -0.1,
      radius_meters: 200000,
      start_m: 3,
      end_m: 6,
      filter_category: 'festival',
    });
  });

  it('returns 500 on Supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Database error' } });

    const request = new Request('http://localhost/api/search?lat=51.5&lng=-0.1');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Database error');
  });
});
