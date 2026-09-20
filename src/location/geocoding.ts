// Resolves a place name to coordinates via Open-Meteo's free, keyless
// geocoding API (PLAN.md §2 locks in Open-Meteo for weather data; this is
// the same no-key/no-billing rationale applied to place search).
export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '1');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const data = (await response.json()) as { results?: GeocodingResult[] };
  return data.results ?? [];
}

export function formatPlaceLabel(place: GeocodingResult): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ');
}
