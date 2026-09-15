import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect } from 'vitest';

expect.extend(toHaveNoViolations);
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia. Default to "no preference matched"
// (light); tests that care about `prefers-color-scheme: dark` override
// `window.matchMedia` for just that test.
if (!window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- intentional no-op stub
  const noop = () => {};
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
  });
}
