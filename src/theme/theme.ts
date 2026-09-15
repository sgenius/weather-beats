// The six weather states from PLAN.md §5, each backing a [data-state]
// palette in src/styles/palettes.css. State classification (which state a
// given WeatherTimeline maps to) is Stage 1 work; this is just the vocabulary.
export type WeatherState =
  'fair' | 'cloudy' | 'rainy' | 'snowy' | 'too-cold' | 'too-hot';

export const WEATHER_STATES: readonly WeatherState[] = [
  'fair',
  'cloudy',
  'rainy',
  'snowy',
  'too-cold',
  'too-hot',
];

// 'system' defers to the `prefers-color-scheme` media query; 'light'/'dark'
// pin an explicit [data-theme] override.
export type ColorSchemePreference = 'system' | 'light' | 'dark';
