import { useEffect } from 'react';
import type { WeatherState } from './theme';
import { useTheme } from './useTheme';

/**
 * Keeps the ThemeProvider's active state in sync with the classified
 * weather state (PLAN.md §5.1), so the app re-themes as conditions change.
 * Must be used inside a ThemeProvider.
 */
export function useWeatherStateTheme(state: WeatherState) {
  const { setState } = useTheme();
  useEffect(() => {
    setState(state);
  }, [state, setState]);
}
