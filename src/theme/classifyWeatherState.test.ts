import { describe, expect, it } from 'vitest';
import type { WeatherSample } from '../contracts';
import { classifyWeatherState } from './classifyWeatherState';

function sample(overrides: Partial<WeatherSample> = {}): WeatherSample {
  return {
    epochMs: 0,
    temperatureC: 20,
    humidityPercent: 50,
    cloudCoverPercent: 20,
    precipitation: { type: 'none', amountMm: 0 },
    ...overrides,
  };
}

describe('classifyWeatherState', () => {
  it('classifies precipitation ahead of temperature, snow vs. rain by type only', () => {
    expect(
      classifyWeatherState(
        sample({
          precipitation: { type: 'snow', amountMm: 1 },
          temperatureC: 35,
        }),
      ),
    ).toBe('snowy');
    expect(
      classifyWeatherState(
        sample({ precipitation: { type: 'rain', amountMm: 1 } }),
      ),
    ).toBe('rainy');
  });

  it('classifies at/below the too-cold threshold as too-cold, ahead of cloud cover', () => {
    expect(
      classifyWeatherState(sample({ temperatureC: 10, cloudCoverPercent: 90 })),
    ).toBe('too-cold');
    expect(classifyWeatherState(sample({ temperatureC: 10.1 }))).not.toBe(
      'too-cold',
    );
  });

  it('classifies at/above the too-hot threshold as too-hot', () => {
    expect(classifyWeatherState(sample({ temperatureC: 32 }))).toBe('too-hot');
    expect(classifyWeatherState(sample({ temperatureC: 31.9 }))).not.toBe(
      'too-hot',
    );
  });

  it('classifies high cloud cover as cloudy when temperate and dry', () => {
    expect(classifyWeatherState(sample({ cloudCoverPercent: 60 }))).toBe(
      'cloudy',
    );
    expect(classifyWeatherState(sample({ cloudCoverPercent: 59.9 }))).toBe(
      'fair',
    );
  });

  it('classifies clear, temperate, dry conditions as fair', () => {
    expect(classifyWeatherState(sample())).toBe('fair');
  });
});
