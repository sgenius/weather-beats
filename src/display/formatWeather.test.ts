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
  it('rounds percentages and temperatures', () => {
    expect(formatPercent(54.6)).toBe('55%');
    expect(formatTemperature(17.4)).toBe('17°C');
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

  it('formats temperature and percent ranges', () => {
    expect(formatTemperatureRange({ min: 12.4, max: 21.6 })).toBe('12–22°C');
    expect(formatPercentRange({ min: 40, max: 80 })).toBe('40–80%');
  });

  it('formats local time from an epoch', () => {
    const epochMs = new Date(2026, 8, 13, 8, 5).getTime();
    expect(formatLocalTime(epochMs)).toMatch(/8:05/);
  });
});
