import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ColorSchemePreference, WeatherState } from './theme';

function prefersDarkColorScheme(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

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
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    prefersDarkColorScheme,
  );

  const value = useMemo(
    () => ({ state, setState, colorScheme, setColorScheme }),
    [state, colorScheme],
  );

  // Attributes go on <html> (not a wrapper element) so the palette's
  // background/ink tokens can style <body> and the whole viewport.
  useEffect(() => {
    document.documentElement.dataset.state = state;
  }, [state]);

  // Keep the 'system' choice live if the OS/browser preference changes
  // while the tab is open (e.g. macOS auto dark mode at sunset).
  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, []);

  // The DOM only ever carries the *resolved* theme - 'light' or 'dark',
  // never 'system' - so palettes.css needs just one unconditional override
  // rule per state (`[data-theme='dark']`) instead of duplicating dark
  // values behind a `prefers-color-scheme` media query as well. That
  // second copy previously only differed from the plain override by being
  // conditional on the media query, which made the two hard to tell apart
  // at a glance - resolving here removes that duplication entirely.
  useEffect(() => {
    const resolved =
      colorScheme === 'system'
        ? systemPrefersDark
          ? 'dark'
          : 'light'
        : colorScheme;
    document.documentElement.dataset.theme = resolved;
  }, [colorScheme, systemPrefersDark]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
