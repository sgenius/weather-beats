// Wraps the browser's Geolocation API in a Promise, and defines the Oakland
// fallback (PLAN.md §2) used when permission is denied or the API is
// unavailable.
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const OAKLAND_FALLBACK: Coordinates = {
  latitude: 37.8044,
  longitude: -122.2711,
};

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
    );
  });
}
