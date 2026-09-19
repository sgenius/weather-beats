import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatPlaceLabel, searchPlaces } from './geocoding';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchPlaces', () => {
  it('returns the matching places from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Paris',
              latitude: 48.85,
              longitude: 2.35,
              country: 'France',
            },
          ],
        }),
      }),
    );

    expect(await searchPlaces('Paris')).toEqual([
      { name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France' },
    ]);
  });

  it('returns an empty array when there are no matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );
    expect(await searchPlaces('asdkjhaslkdj')).toEqual([]);
  });

  it('throws when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(searchPlaces('Paris')).rejects.toThrow(/500/);
  });
});

describe('formatPlaceLabel', () => {
  it('joins name, region, and country', () => {
    expect(
      formatPlaceLabel({
        name: 'Paris',
        latitude: 0,
        longitude: 0,
        admin1: 'Île-de-France',
        country: 'France',
      }),
    ).toBe('Paris, Île-de-France, France');
  });

  it('skips missing fields', () => {
    expect(formatPlaceLabel({ name: 'Paris', latitude: 0, longitude: 0 })).toBe(
      'Paris',
    );
  });
});
