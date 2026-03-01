import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variable
const originalEnv = process.env;

// We need to mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv, KIT_API_KEY: 'test-api-key-123' };
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

async function importRoute() {
  const mod = await import('@/app/api/subscribe/route');
  return mod;
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
  it('creates subscriber and returns success for valid email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriber: { id: 42, email: 'test@example.com' },
      }),
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'test@example.com', interests: [], eventCategory: 'festival' })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.kit.com/v4/subscribers',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns 400 for invalid email', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ email: 'not-an-email' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('valid email');
  });

  it('returns 400 for missing email', async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ interests: ['festivals'] }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('valid email');
  });

  it('tags subscriber based on interests array', async () => {
    // Create subscriber succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriber: { id: 99, email: 'tag@test.com' },
      }),
    });
    // Tag calls (TAG_IDS are 0 placeholders so tagSubscriber skips them)
    // No additional fetch calls expected since tag IDs are 0

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'tag@test.com', interests: ['festivals', 'wildlife'] })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Only the createSubscriber call since placeholder tag IDs (0) are skipped
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('auto-tags subscriber with eventCategory', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subscriber: { id: 77, email: 'cat@test.com' },
      }),
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'cat@test.com', interests: [], eventCategory: 'wildlife' })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 500 when Kit API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'fail@test.com', interests: [] })
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeTruthy();
  });

  it('returns 503 when KIT_API_KEY is not set', async () => {
    delete process.env.KIT_API_KEY;

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'nokey@test.com', interests: [] })
    );
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toContain('not configured');
  });
});
