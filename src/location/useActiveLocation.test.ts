import { act, renderHook, waitFor } from '@testing-library/react';
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
  it('starts locating, then adopts the located position', async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 51.5, longitude: -0.12 },
      } as GeolocationPosition);
    });

    const { result } = renderHook(() => useActiveLocation());
    expect(result.current.location.status).toBe('locating');

    await waitFor(() => expect(result.current.location.status).toBe('located'));
    expect(result.current.location.coordinates).toEqual({
      latitude: 51.5,
      longitude: -0.12,
    });
  });

  it('falls back to Oakland when geolocation is denied or unavailable', async () => {
    mockGeolocation((_success, error) => {
      error?.({ code: 1, message: 'denied' } as GeolocationPositionError);
    });

    const { result } = renderHook(() => useActiveLocation());
    await waitFor(() =>
      expect(result.current.location.status).toBe('fallback'),
    );
    expect(result.current.location.coordinates).toEqual(OAKLAND_FALLBACK);
  });

  it('lets a searched location override the resolved one', () => {
    const { result } = renderHook(() => useActiveLocation());

    act(() =>
      result.current.setSearchedLocation(
        { latitude: 48.85, longitude: 2.35 },
        'Paris',
      ),
    );

    expect(result.current.location).toEqual({
      status: 'searched',
      coordinates: { latitude: 48.85, longitude: 2.35 },
      label: 'Paris',
    });
  });

  it('keeps a searched location even after a pending geolocation resolves', async () => {
    let resolveGeolocation!: (position: GeolocationPosition) => void;
    mockGeolocation((success) => {
      resolveGeolocation = success;
    });

    const { result } = renderHook(() => useActiveLocation());

    act(() =>
      result.current.setSearchedLocation(
        { latitude: 48.85, longitude: 2.35 },
        'Paris',
      ),
    );

    act(() => {
      resolveGeolocation({
        coords: { latitude: 51.5, longitude: -0.12 },
      } as GeolocationPosition);
    });

    expect(result.current.location.status).toBe('searched');
  });
});
