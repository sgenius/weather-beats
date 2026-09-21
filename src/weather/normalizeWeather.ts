// Normalises an Open-Meteo forecast response into the app's one weather
// contract (PLAN.md §3). Pure and Tone.js/network-free, like the sandbox's
// equivalent in sandboxTimeline.ts.
import type {
  Precipitation,
  PrecipitationType,
  WeatherTimeline,
} from '../contracts';
import type { OpenMeteoResponse } from './openMeteo';

const FORECAST_HOURS = 12;

function classifyPrecipitationType(
  precipitationMm: number,
  snowfallCm: number,
): PrecipitationType {
  // Snow is precipitation-type only, never inferred from temperature
  // (PLAN.md §5.1) - Open-Meteo's own snowfall field is that type signal.
  if (snowfallCm > 0) return 'snow';
  if (precipitationMm > 0) return 'rain';
  return 'none';
}

/** Index of the hourly entry that contains "now" (the last one at or before it). */
function findCurrentHourIndex(
  hourlyTimes: string[],
  currentTimeIso: string,
): number {
  const currentEpoch = Date.parse(currentTimeIso);
  let index = 0;
  for (let i = 0; i < hourlyTimes.length; i += 1) {
    if (Date.parse(hourlyTimes[i]) <= currentEpoch) index = i;
    else break;
  }
  return index;
}

export function normalizeOpenMeteoResponse(
  response: OpenMeteoResponse,
): WeatherTimeline {
  const { hourly, daily, current } = response;
  const startIndex = findCurrentHourIndex(hourly.time, current.time);
  const endIndex = startIndex + FORECAST_HOURS + 1;

  const samples = hourly.time.slice(startIndex, endIndex).map((time, i) => {
    const index = startIndex + i;
    const precipitation: Precipitation = {
      amountMm: hourly.precipitation[index] ?? 0,
      type: classifyPrecipitationType(
        hourly.precipitation[index] ?? 0,
        hourly.snowfall[index] ?? 0,
      ),
    };
    return {
      // Naively parsed (no UTC offset in Open-Meteo's timezone=auto
      // strings): correctly 1-hour spaced for ordering, which is all
      // downstream code needs - see time/naiveLocalIso.ts for why display
      // uses localTimeIso directly instead.
      epochMs: Date.parse(time),
      temperatureC: hourly.temperature_2m[index],
      humidityPercent: hourly.relative_humidity_2m[index],
      cloudCoverPercent: hourly.cloud_cover[index],
      precipitation,
    };
  });

  const today = current.time.slice(0, 10);
  const todayHumidities = hourly.time
    .map((time, index) => ({
      time,
      humidity: hourly.relative_humidity_2m[index],
    }))
    .filter(({ time }) => time.startsWith(today))
    .map(({ humidity }) => humidity);

  return {
    localTimeIso: current.time,
    samples,
    todayTemperatureRangeC:
      daily.temperature_2m_min[0] !== undefined
        ? { min: daily.temperature_2m_min[0], max: daily.temperature_2m_max[0] }
        : undefined,
    todayHumidityRangePercent:
      todayHumidities.length > 0
        ? {
            min: Math.min(...todayHumidities),
            max: Math.max(...todayHumidities),
          }
        : undefined,
  };
}
