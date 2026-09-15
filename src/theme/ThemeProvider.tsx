import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ColorSchemePreference, WeatherState } from './theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultState?: WeatherState;
}

export function ThemeProvider({
  children,
  defaultState = 'fair',
}: ThemeProviderProps) {
  const [state, setState] = useState<WeatherState>(defaultState);
  const [colorScheme, setColorScheme] =
    useState<ColorSchemePreference>('system');

  const value = useMemo(
    () => ({ state, setState, colorScheme, setColorScheme }),
    [state, colorScheme],
  );

  // Attributes go on <html> (not a wrapper element) so the palette's
  // background/ink tokens can style <body> and the whole viewport.
  useEffect(() => {
    document.documentElement.dataset.state = state;
  }, [state]);

  useEffect(() => {
    if (colorScheme === 'system') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = colorScheme;
    }
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
