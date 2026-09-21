import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchForecast } from './openMeteo';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchForecast', () => {
  it('requests current/hourly/daily fields for the given coordinates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ current: {}, hourly: {}, daily: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchForecast({ latitude: 37.8, longitude: -122.27 });

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://api.open-meteo.com/v1/forecast',
    );
    expect(requestedUrl.searchParams.get('latitude')).toBe('37.8');
    expect(requestedUrl.searchParams.get('longitude')).toBe('-122.27');
    expect(requestedUrl.searchParams.get('timezone')).toBe('auto');
    expect(requestedUrl.searchParams.get('hourly')).toContain('temperature_2m');
  });

  it('returns the parsed JSON response', async () => {
    const body = {
      current: { time: '2026-09-21T14:00' },
      hourly: {},
      daily: {},
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => body }),
    );

    expect(await fetchForecast({ latitude: 0, longitude: 0 })).toEqual(body);
  });

  it('throws when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(fetchForecast({ latitude: 0, longitude: 0 })).rejects.toThrow(
      /503/,
    );
  });
});
