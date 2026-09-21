// Open-Meteo forecast client (PLAN.md §2: no key, no billing).
import type { Coordinates } from '../location/geolocation';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export interface OpenMeteoResponse {
  current: {
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    cloud_cover: number[];
    precipitation: number[];
    snowfall: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function fetchForecast({
  latitude,
  longitude,
}: Coordinates): Promise<OpenMeteoResponse> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m');
  url.searchParams.set(
    'hourly',
    'temperature_2m,relative_humidity_2m,cloud_cover,precipitation,snowfall',
  );
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
  // today + tomorrow, so "next 12h" always has hourly data even late at night
  url.searchParams.set('forecast_days', '2');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }
  return (await response.json()) as OpenMeteoResponse;
}
