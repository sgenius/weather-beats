import { createContext } from 'react';
import type { ColorSchemePreference, WeatherState } from './theme';

export interface ThemeContextValue {
  state: WeatherState;
  setState: (state: WeatherState) => void;
  colorScheme: ColorSchemePreference;
  setColorScheme: (scheme: ColorSchemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
