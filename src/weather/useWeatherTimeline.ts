import { useState, useEffect } from 'react';
import type { WeatherTimeline } from '../contracts';
import type { Coordinates } from '../location/geolocation';
import { normalizeOpenMeteoResponse } from './normalizeWeather';
import { fetchForecast } from './openMeteo';
import { getCachedTimeline, setCachedTimeline } from './weatherCache';

export type WeatherStatus = 'loading' | 'ready' | 'error';

export interface UseWeatherTimelineResult {
  status: WeatherStatus;
  timeline?: WeatherTimeline;
  error?: string;
}

/** Fetches (and caches) the live WeatherTimeline for a location. */
export function useWeatherTimeline(
  coordinates: Coordinates,
): UseWeatherTimelineResult {
  // A cache hit is served directly from render - no effect/setState needed
  // for it, only the genuine async side effect below (a cache miss).
  const cached = getCachedTimeline(coordinates);
  const coordsKey = `${coordinates.latitude},${coordinates.longitude}`;

  const [fetchedFor, setFetchedFor] = useState(coordsKey);
  const [fetched, setFetched] = useState<UseWeatherTimelineResult>({
    status: 'loading',
  });

  // Reset to "loading" the moment coordinates change, in the same render
  // (React's documented pattern for adjusting state from a changed prop) -
  // an effect would only be able to do this a render late, flashing the
  // previous location's result first.
  if (coordsKey !== fetchedFor) {
    setFetchedFor(coordsKey);
    setFetched({ status: 'loading' });
  }

  useEffect(() => {
    if (getCachedTimeline(coordinates)) return;
    let cancelled = false;

    fetchForecast(coordinates)
      .then((response) => {
        const timeline = normalizeOpenMeteoResponse(response);
        setCachedTimeline(coordinates, timeline);
        if (!cancelled) setFetched({ status: 'ready', timeline });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFetched({
            status: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Failed to load weather.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // Coordinates are compared by value (lat/lng, via coordsKey above), not
    // object identity, so the effect doesn't re-fire on every render with a
    // fresh object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates.latitude, coordinates.longitude]);

  return cached ? { status: 'ready', timeline: cached } : fetched;
}
