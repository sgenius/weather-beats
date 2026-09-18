import { useEffect, useState } from 'react';
import {
  type Coordinates,
  getCurrentPosition,
  OAKLAND_FALLBACK,
} from './geolocation';

export type LocationStatus = 'locating' | 'granted' | 'fallback';

export interface ActiveLocation {
  status: LocationStatus;
  coordinates: Coordinates;
  label: string;
}

const LOCATING: ActiveLocation = {
  status: 'locating',
  coordinates: OAKLAND_FALLBACK,
  label: 'Locating…',
};

const FALLBACK: ActiveLocation = {
  status: 'fallback',
  coordinates: OAKLAND_FALLBACK,
  label: 'Oakland, California (fallback)',
};

/**
 * Resolves the active location: the browser's geolocation once granted, or
 * the Oakland fallback (PLAN.md §2) if permission is denied or geolocation
 * is unavailable. A non-map location picker (searching a place by name)
 * lands in a later PR.
 *
 * Starts directly at the fallback, with no "Locating…" flash, when
 * geolocation isn't supported at all - there's nothing pending to wait on.
 */
export function useActiveLocation(): ActiveLocation {
  const [location, setLocation] = useState<ActiveLocation>(() =>
    navigator.geolocation ? LOCATING : FALLBACK,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;

    getCurrentPosition()
      .then((coordinates) => {
        if (!cancelled) {
          setLocation({
            status: 'granted',
            coordinates,
            label: 'Your location',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLocation(FALLBACK);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
