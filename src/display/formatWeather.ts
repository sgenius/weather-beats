// Pure formatting helpers for the data display panel - kept separate from
// the component so they're unit-testable without rendering anything.
import type { Precipitation, WeatherRange } from '../contracts';
import { formatNaiveLocalTime } from '../time/naiveLocalIso';
import {
  celsiusToFahrenheit,
  type TemperatureUnit,
} from '../units/temperatureUnit';

/**
 * Formats WeatherTimeline.localTimeIso, which is always the active
 * location's own wall-clock time (see its doc comment) - never routed
 * through a Date/timezone conversion, so it displays correctly even when
 * the location's timezone differs from the browser's own.
 */
export function formatLocalTime(localTimeIso: string): string {
  return formatNaiveLocalTime(localTimeIso);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function convertAndLabel(celsius: number, unit: TemperatureUnit) {
  return unit === 'fahrenheit'
    ? { value: celsiusToFahrenheit(celsius), symbol: '°F' }
    : { value: celsius, symbol: '°C' };
}

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
): string {
  const { value, symbol } = convertAndLabel(celsius, unit);
  return `${Math.round(value)}${symbol}`;
}

export function formatPrecipitation({ type, amountMm }: Precipitation): string {
  if (type === 'none') return 'None';
  return `${type === 'snow' ? 'Snow' : 'Rain'}, ${amountMm.toFixed(1)} mm`;
}

export function formatTemperatureRange(
  { min, max }: WeatherRange,
  unit: TemperatureUnit,
): string {
  const from = convertAndLabel(min, unit);
  const to = convertAndLabel(max, unit);
  return `${Math.round(from.value)}–${Math.round(to.value)}${to.symbol}`;
}

export function formatPercentRange({ min, max }: WeatherRange): string {
  return `${Math.round(min)}–${Math.round(max)}%`;
}
