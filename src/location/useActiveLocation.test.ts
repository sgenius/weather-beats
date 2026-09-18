import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OAKLAND_FALLBACK } from './geolocation';
import { useActiveLocation } from './useActiveLocation';

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

describe('useActiveLocation', () => {
  it('starts locating, then adopts the granted position', async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 51.5, longitude: -0.12 },
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useActiveLocation());
    expect(result.current.status).toBe('locating');

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.coordinates).toEqual({
      latitude: 51.5,
      longitude: -0.12,
    });
  });

  it('falls back to Oakland when geolocation is denied or unavailable', async () => {
    mockGeolocation((_success, error) => {
      error?.({ code: 1, message: 'denied' } as GeolocationPositionError);
    });

    const { result } = renderHook(() => useActiveLocation());
    await waitFor(() => expect(result.current.status).toBe('fallback'));
    expect(result.current.coordinates).toEqual(OAKLAND_FALLBACK);
  });
});
