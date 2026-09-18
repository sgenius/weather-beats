import { afterEach, describe, expect, it } from 'vitest';
import { getCurrentPosition, OAKLAND_FALLBACK } from './geolocation';

function mockGeolocation(
  getCurrentPositionImpl: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => void,
) {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: { getCurrentPosition: getCurrentPositionImpl },
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: undefined,
    configurable: true,
  });
});

describe('getCurrentPosition', () => {
  it('resolves with coordinates on success', async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 1, longitude: 2 },
      } as GeolocationPosition);
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 1,
      longitude: 2,
    });
  });

  it('rejects when the browser reports an error, e.g. permission denied', async () => {
    mockGeolocation((_success, error) => {
      error?.({ code: 1, message: 'denied' } as GeolocationPositionError);
    });
    await expect(getCurrentPosition()).rejects.toBeDefined();
  });

  it('rejects when geolocation is not supported', async () => {
    await expect(getCurrentPosition()).rejects.toThrow(/not supported/i);
  });
});

describe('OAKLAND_FALLBACK', () => {
  it('is Oakland, California', () => {
    expect(OAKLAND_FALLBACK.latitude).toBeCloseTo(37.8, 0);
    expect(OAKLAND_FALLBACK.longitude).toBeCloseTo(-122.27, 1);
  });
});
