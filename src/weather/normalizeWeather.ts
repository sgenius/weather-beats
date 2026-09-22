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

/**
 * Open-Meteo's timezone=auto times (e.g. "2026-09-21T14:00") are the
 * location's wall-clock time with no UTC offset of their own - Date.parse
 * would silently (mis)interpret them as the *browser's* zone. Reinterpreting
 * the string as UTC, then undoing utcOffsetSeconds, recovers the real
 * instant regardless of where the browser is.
 */
function toRealEpochMs(
  naiveLocalIso: string,
  utcOffsetSeconds: number,
): number {
  return Date.parse(`${naiveLocalIso}Z`) - utcOffsetSeconds * 1000;
}

/** Index of the hourly entry that contains "now" (the last one at or before it). */
function findCurrentHourIndex(
  hourlyEpochs: number[],
  currentEpochMs: number,
): number {
  let index = 0;
  for (let i = 0; i < hourlyEpochs.length; i += 1) {
    if (hourlyEpochs[i] <= currentEpochMs) index = i;
    else break;
  }
  return index;
}

export function normalizeOpenMeteoResponse(
  response: OpenMeteoResponse,
): WeatherTimeline {
  const {
    hourly,
    daily,
    current,
    utc_offset_seconds: utcOffsetSeconds,
  } = response;
  const hourlyEpochs = hourly.time.map((time) =>
    toRealEpochMs(time, utcOffsetSeconds),
  );
  const currentEpochMs = toRealEpochMs(current.time, utcOffsetSeconds);

  const startIndex = findCurrentHourIndex(hourlyEpochs, currentEpochMs);
  const endIndex = startIndex + FORECAST_HOURS + 1;

  const samples = hourlyEpochs.slice(startIndex, endIndex).map((epochMs, i) => {
    const index = startIndex + i;
    const precipitation: Precipitation = {
      amountMm: hourly.precipitation[index] ?? 0,
      type: classifyPrecipitationType(
        hourly.precipitation[index] ?? 0,
        hourly.snowfall[index] ?? 0,
      ),
    };
    return {
      epochMs,
      temperatureC: hourly.temperature_2m[index],
      humidityPercent: hourly.relative_humidity_2m[index],
      cloudCoverPercent: hourly.cloud_cover[index],
      precipitation,
    };
  });

  // Grouping by the location's own calendar day only needs the wall-clock
  // string, not a real instant, so this stays a plain text comparison.
  const today = current.time.slice(0, 10);
  const todayHumidities = hourly.time
    .map((time, index) => ({
      time,
      humidity: hourly.relative_humidity_2m[index],
    }))
    .filter(({ time }) => time.startsWith(today))
    .map(({ humidity }) => humidity);

  return {
    timeZone: response.timezone,
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
