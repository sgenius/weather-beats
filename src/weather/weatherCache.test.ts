import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WeatherTimeline } from '../contracts';
import {
  clearWeatherCache,
  getCachedTimeline,
  setCachedTimeline,
} from './weatherCache';

const timeline: WeatherTimeline = { samples: [] };

beforeEach(() => {
  vi.useFakeTimers();
  clearWeatherCache();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('weatherCache', () => {
  it('returns undefined when nothing is cached for the coordinates', () => {
    expect(getCachedTimeline({ latitude: 1, longitude: 2 })).toBeUndefined();
  });

  it('returns a cached timeline for the same (rounded) coordinates', () => {
    setCachedTimeline({ latitude: 37.804, longitude: -122.271 }, timeline);
    expect(getCachedTimeline({ latitude: 37.8044, longitude: -122.2711 })).toBe(
      timeline,
    );
  });

  it('treats meaningfully different coordinates as a cache miss', () => {
    setCachedTimeline({ latitude: 37.8, longitude: -122.27 }, timeline);
    expect(
      getCachedTimeline({ latitude: 48.85, longitude: 2.35 }),
    ).toBeUndefined();
  });

  it('expires an entry after the TTL', () => {
    setCachedTimeline({ latitude: 10, longitude: 10 }, timeline);
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect(getCachedTimeline({ latitude: 10, longitude: 10 })).toBeUndefined();
  });

  it('clearWeatherCache empties every entry', () => {
    setCachedTimeline({ latitude: 20, longitude: 20 }, timeline);
    clearWeatherCache();
    expect(getCachedTimeline({ latitude: 20, longitude: 20 })).toBeUndefined();
  });
});
