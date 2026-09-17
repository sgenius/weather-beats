// Pure formatting helpers for the data display panel - kept separate from
// the component so they're unit-testable without rendering anything.
import type { Precipitation, WeatherRange } from '../contracts';

export function formatLocalTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

export function formatPrecipitation({ type, amountMm }: Precipitation): string {
  if (type === 'none') return 'None';
  return `${type === 'snow' ? 'Snow' : 'Rain'}, ${amountMm.toFixed(1)} mm`;
}

export function formatTemperatureRange({ min, max }: WeatherRange): string {
  return `${Math.round(min)}–${Math.round(max)}°C`;
}

export function formatPercentRange({ min, max }: WeatherRange): string {
  return `${Math.round(min)}–${Math.round(max)}%`;
}
