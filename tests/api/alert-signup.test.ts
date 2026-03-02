import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalEnv = process.env;
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

describe('POST /api/subscribe — alert signup', () => {
  it('sets custom field when alert=true and region provided', async () => {
    // createSubscriber
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriber: { id: 42, email: 'alert@test.com' } }),
    });
    // setSubscriberCustomField (PUT)
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        email: 'alert@test.com',
        alert: true,
        region: 'London',
        categories: ['festivals', 'wildlife'],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify custom field PUT was called
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const putCall = mockFetch.mock.calls[1];
    expect(putCall[0]).toBe('https://api.kit.com/v4/subscribers/42');
    expect(putCall[1].method).toBe('PUT');
    const putBody = JSON.parse(putCall[1].body);
    expect(putBody.custom_fields.alert_region).toBe('London');
  });

  it('returns 400 when alert=true but region is missing', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        email: 'alert@test.com',
        alert: true,
        categories: ['festivals'],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Region');
  });

  it('returns 400 when alert=true but region is empty string', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        email: 'alert@test.com',
        alert: true,
        region: '  ',
        categories: ['festivals'],
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Region');
  });

  it('works as before when alert flag is absent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriber: { id: 77, email: 'normal@test.com' } }),
    });

    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ email: 'normal@test.com', interests: [], eventCategory: 'festival' }),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Only createSubscriber called, no PUT for custom fields
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when categories is not an array', async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({
        email: 'alert@test.com',
        alert: true,
        region: 'London',
        categories: 'not-an-array',
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Categories');
  });
});
