import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import type { WeatherState } from './theme';
import { useWeatherStateTheme } from './useWeatherStateTheme';

function Probe({ state }: { state: WeatherState }) {
  useWeatherStateTheme(state);
  return null;
}

describe('useWeatherStateTheme', () => {
  it('syncs the ThemeProvider state to the given weather state, live', () => {
    const { rerender } = render(
      <ThemeProvider>
        <Probe state="rainy" />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.state).toBe('rainy');

    rerender(
      <ThemeProvider>
        <Probe state="too-hot" />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.state).toBe('too-hot');
  });
});
