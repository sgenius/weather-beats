import type { ActiveLocation } from './useActiveLocation';

interface LocationStatusProps {
  location: ActiveLocation;
}

/**
 * Announces the active location as it resolves (PLAN.md §6: polite
 * announcements on location change) - a live region so screen reader users
 * hear the geolocation -> fallback transition, not just see it.
 */
export function LocationStatus({ location }: LocationStatusProps) {
  return (
    <p aria-live="polite">
      Location: {location.label} ({location.coordinates.latitude.toFixed(2)},{' '}
      {location.coordinates.longitude.toFixed(2)})
    </p>
  );
}
