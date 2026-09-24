// The one contract between weather data and everything downstream (display,
// sonification, the "what you're hearing" panel, the sandbox) - PLAN.md §3.
// Unit-agnostic: temperature is always Celsius here, converted for display.

export type PrecipitationType = 'none' | 'rain' | 'snow';

export interface Precipitation {
  amountMm: number;
  type: PrecipitationType;
}

export interface WeatherSample {
  /** Unix epoch milliseconds this sample describes - the source of truth
   * for its position in time; self-contained so a sample is meaningful
   * (comparable, cacheable) without its sibling samples or the parent
   * WeatherTimeline. */
  epochMs: number;
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
  /**
   * IANA time zone name (e.g. "America/Los_Angeles") for the active
   * location, for display purposes only: pass it as `Intl`/`Date`'s
   * `timeZone` option to render any sample's epochMs as that location's
   * wall-clock time, regardless of the browser's own zone. Undefined means
   * "the browser's own local zone" - the sandbox's intent, since it has no
   * location of its own.
   */
  timeZone?: string;
  /**
   * epochMs-ascending samples, starting with "now" as samples[0]. Up to 13
   * samples (now + next 12h) when an hourly forecast is available; a
   * single sample is the fallback that limits playback to "Now" mode
   * (PLAN.md §4.1).
   */
  samples: WeatherSample[];
  todayTemperatureRangeC?: WeatherRange;
  todayHumidityRangePercent?: WeatherRange;
}
