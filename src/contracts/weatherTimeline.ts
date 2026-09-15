// The one contract between weather data and everything downstream (display,
// sonification, the "what you're hearing" panel, the sandbox) - PLAN.md §3.
// Unit-agnostic: temperature is always Celsius here, converted for display.

export type PrecipitationType = 'none' | 'rain' | 'snow';

export interface Precipitation {
  amountMm: number;
  type: PrecipitationType;
}

export interface WeatherSample {
  /** Hours ahead of "now" this sample represents; 0 for the current sample. */
  hourOffset: number;
  temperatureC: number;
  humidityPercent: number;
  cloudCoverPercent: number;
  precipitation: Precipitation;
}

export interface WeatherRange {
  min: number;
  max: number;
}

export interface WeatherTimeline {
  /** Local time at the active location, at hourOffset 0 (ISO 8601 with offset). */
  localTimeIso: string;
  /**
   * hourOffset-ascending samples, starting at 0 ("now"). Up to 13 samples
   * (now + next 12h) when an hourly forecast is available; a single sample
   * is the fallback that limits playback to "Now" mode (PLAN.md §4.1).
   */
  samples: WeatherSample[];
  todayTemperatureRangeC?: WeatherRange;
  todayHumidityRangePercent?: WeatherRange;
}
