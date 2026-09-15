import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

function Probe() {
  const { state, setState, setColorScheme } = useTheme();
  return (
    <>
      <span data-testid="state">{state}</span>
      <button onClick={() => setState('rainy')}>go rainy</button>
      <button onClick={() => setColorScheme('dark')}>go dark</button>
      <button onClick={() => setColorScheme('light')}>go light</button>
    </>
  );
}

/** Stubs `window.matchMedia('(prefers-color-scheme: dark)')` for one test. */
function mockPrefersDark(matches: boolean) {
  const original = window.matchMedia;
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional no-op stub
  const noop = () => {};
  window.matchMedia = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => false,
    }) as MediaQueryList;
  return () => {
    window.matchMedia = original;
  };
}

describe('ThemeProvider', () => {
  let restoreMatchMedia: (() => void) | undefined;

  beforeEach(() => {
    delete document.documentElement.dataset.state;
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    restoreMatchMedia?.();
    restoreMatchMedia = undefined;
  });

  it('defaults the document to the fair state', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.state).toBe('fair');
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

  it('resolves "system" from the browser/OS preference', () => {
    restoreMatchMedia = mockPrefersDark(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('honours an explicit choice even when it contradicts the OS preference', () => {
    // The scenario raised in review: OS/browser prefers light, but the user
    // has explicitly picked dark - the explicit choice must win.
    restoreMatchMedia = mockPrefersDark(false);
    const { getByText } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe('light');

    act(() => getByText('go dark').click());
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => getByText('go light').click());
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
