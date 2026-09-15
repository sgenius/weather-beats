import 'vitest';

interface CustomMatchers<R = unknown> {
  toHaveNoViolations: () => R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type -- matches Vitest's own custom-matcher typing recipe
  interface Assertion<T = any> extends CustomMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- matches Vitest's own custom-matcher typing recipe
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
