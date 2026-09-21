import { describe, expect, it } from 'vitest';
import {
  formatLocalTime,
  formatPercent,
  formatPercentRange,
  formatPrecipitation,
  formatTemperature,
  formatTemperatureRange,
} from './formatWeather';

describe('formatWeather', () => {
  it('rounds percentages', () => {
    expect(formatPercent(54.6)).toBe('55%');
  });

  it('formats temperature in either unit, converting from Celsius', () => {
    expect(formatTemperature(17.4, 'celsius')).toBe('17°C');
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°F');
    expect(formatTemperature(100, 'fahrenheit')).toBe('212°F');
  });

  it('formats precipitation, including "none"', () => {
    expect(formatPrecipitation({ type: 'none', amountMm: 0 })).toBe('None');
    expect(formatPrecipitation({ type: 'rain', amountMm: 2.4 })).toBe(
      'Rain, 2.4 mm',
    );
    expect(formatPrecipitation({ type: 'snow', amountMm: 1 })).toBe(
      'Snow, 1.0 mm',
    );
  });

  it('formats a temperature range in either unit', () => {
    expect(formatTemperatureRange({ min: 12.4, max: 21.6 }, 'celsius')).toBe(
      '12–22°C',
    );
    expect(formatTemperatureRange({ min: 0, max: 100 }, 'fahrenheit')).toBe(
      '32–212°F',
    );
  });

  it('formats a percent range', () => {
    expect(formatPercentRange({ min: 40, max: 80 })).toBe('40–80%');
  });

  it('formats local time from an epoch', () => {
    const epochMs = new Date(2026, 8, 13, 8, 5).getTime();
    expect(formatLocalTime(epochMs)).toMatch(/8:05/);
  });
});
