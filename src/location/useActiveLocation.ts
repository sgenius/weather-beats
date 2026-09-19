import { useEffect, useRef, useState } from 'react';
import {
  type Coordinates,
  getCurrentPosition,
  OAKLAND_FALLBACK,
} from './geolocation';

/**
 * 'locating' is the only pending status - a placeholder while we wait on
 * the browser's geolocation prompt. The other three are all settled/final,
 * distinguished only by how the location was determined: automatically via
 * geolocation ('located'), automatically defaulted ('fallback'), or
 * explicitly typed by the user ('userSearched') - which is also the one
 * `setSearchedLocation` can never let a late geolocation result overwrite.
 */
export type LocationStatus =
  'locating' | 'located' | 'fallback' | 'userSearched';

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

export interface UseActiveLocationResult {
  location: ActiveLocation;
  /** Overrides the resolved location with one the user searched for. */
  setSearchedLocation: (coordinates: Coordinates, label: string) => void;
}

/**
 * Resolves the active location: the browser's geolocation once granted, or
 * the Oakland fallback (PLAN.md §2) if permission is denied or geolocation
 * is unavailable - either can be overridden by searching a place by name
 * (`LocationPicker`).
 *
 * Starts directly at the fallback, with no "Locating…" flash, when
 * geolocation isn't supported at all - there's nothing pending to wait on.
 */
export function useActiveLocation(): UseActiveLocationResult {
  const [location, setLocation] = useState<ActiveLocation>(() =>
    navigator.geolocation ? LOCATING : FALLBACK,
  );
  // Geolocation resolves asynchronously; this guards against it overwriting
  // a location the user has already searched for in the meantime.
  const overriddenRef = useRef(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let cancelled = false;

    getCurrentPosition()
      .then((coordinates) => {
        if (!cancelled && !overriddenRef.current) {
          setLocation({
            status: 'located',
            coordinates,
            label: 'Your location',
          });
        }
      })
      .catch(() => {
        if (!cancelled && !overriddenRef.current) setLocation(FALLBACK);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setSearchedLocation(coordinates: Coordinates, label: string) {
    overriddenRef.current = true;
    setLocation({ status: 'userSearched', coordinates, label });
  }

  return { location, setSearchedLocation };
}
