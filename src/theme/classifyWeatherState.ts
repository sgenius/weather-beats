// Applies the PLAN.md §5.1 state-classification rules (first match wins) to
// a WeatherSample, deriving which of the six state palettes themes the app.
import type { WeatherSample } from '../contracts';
import type { WeatherState } from './theme';

const TOO_COLD_MAX_C = 10;
const TOO_HOT_MIN_C = 32;
const CLOUDY_MIN_PERCENT = 60;

export function classifyWeatherState(sample: WeatherSample): WeatherState {
  if (sample.precipitation.type !== 'none') {
    return sample.precipitation.type === 'snow' ? 'snowy' : 'rainy';
  }
  if (sample.temperatureC <= TOO_COLD_MAX_C) return 'too-cold';
  if (sample.temperatureC >= TOO_HOT_MIN_C) return 'too-hot';
  if (sample.cloudCoverPercent >= CLOUDY_MIN_PERCENT) return 'cloudy';
  return 'fair';
}
