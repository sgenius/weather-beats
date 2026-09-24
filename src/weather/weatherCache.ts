// A small time-limited cache, keyed by (rounded) coordinates, so panning
// between recently-seen locations or quick re-renders don't refetch or
// hammer Open-Meteo (PLAN.md §9: "cache Open-Meteo responses, back off on
// errors"). Hourly data doesn't need to be fresher than this.
import type { Coordinates } from '../location/geolocation';
import type { WeatherTimeline } from '../contracts';

const TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  timeline: WeatherTimeline;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey({ latitude, longitude }: Coordinates): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export function getCachedTimeline(
  coordinates: Coordinates,
): WeatherTimeline | undefined {
  const entry = cache.get(cacheKey(coordinates));
  if (!entry || entry.expiresAt < Date.now()) return undefined;
  return entry.timeline;
}

export function setCachedTimeline(
  coordinates: Coordinates,
  timeline: WeatherTimeline,
): void {
  cache.set(cacheKey(coordinates), {
    timeline,
    expiresAt: Date.now() + TTL_MS,
  });
}

/** Test-only: the cache is otherwise module-lifetime, by design. */
export function clearWeatherCache(): void {
  cache.clear();
}
