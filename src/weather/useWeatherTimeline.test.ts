import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeatherTimeline } from '../contracts';
import * as openMeteo from './openMeteo';
import { clearWeatherCache, setCachedTimeline } from './weatherCache';
import { useWeatherTimeline } from './useWeatherTimeline';

beforeEach(() => {
  clearWeatherCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const fakeResponse: openMeteo.OpenMeteoResponse = {
  timezone: 'UTC',
  timezone_abbreviation: 'UTC',
  utc_offset_seconds: 0,
  current: { time: '2026-09-24T12:00' },
  hourly: {
    time: ['2026-09-24T12:00'],
    temperature_2m: [20],
    relative_humidity_2m: [50],
    cloud_cover: [10],
    precipitation: [0],
    snowfall: [0],
  },
  daily: { temperature_2m_max: [22], temperature_2m_min: [14] },
};

describe('useWeatherTimeline', () => {
  it('resolves to a ready timeline on success', async () => {
    vi.spyOn(openMeteo, 'fetchForecast').mockResolvedValue(fakeResponse);

    const { result } = renderHook(() =>
      useWeatherTimeline({ latitude: 1, longitude: 1 }),
    );
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.timeline?.samples[0].temperatureC).toBe(20);
  });

  it('resolves to an error status when the request fails', async () => {
    vi.spyOn(openMeteo, 'fetchForecast').mockRejectedValue(
      new Error('Weather request failed: 500'),
    );

    const { result } = renderHook(() =>
      useWeatherTimeline({ latitude: 2, longitude: 2 }),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Weather request failed: 500');
  });

  it('serves a cached timeline without calling fetchForecast again', async () => {
    const cached: WeatherTimeline = { samples: [] };
    setCachedTimeline({ latitude: 3, longitude: 3 }, cached);
    const fetchSpy = vi.spyOn(openMeteo, 'fetchForecast');

    const { result } = renderHook(() =>
      useWeatherTimeline({ latitude: 3, longitude: 3 }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.timeline).toBe(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
