import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

function Probe() {
  const { state, setState, setColorScheme } = useTheme();
  return (
    <>
      <span data-testid="state">{state}</span>
      <button onClick={() => setState('rainy')}>go rainy</button>
      <button onClick={() => setColorScheme('dark')}>go dark</button>
    </>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.state;
    delete document.documentElement.dataset.theme;
  });

  it('defaults the document to the fair state with no explicit theme', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.state).toBe('fair');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('updates document attributes when state/theme change', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    act(() => getByText('go rainy').click());
    expect(document.documentElement.dataset.state).toBe('rainy');

    act(() => getByText('go dark').click());
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
