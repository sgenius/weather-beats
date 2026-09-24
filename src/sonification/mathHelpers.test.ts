import { describe, expect, it } from 'vitest';
import { clamp, lerp, normalize } from './mathHelpers';

describe('mathHelpers', () => {
  it('clamp leaves in-range values alone and clamps out-of-range ones', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lerp interpolates and clamps t to [0, 1]', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, -1)).toBe(0);
    expect(lerp(0, 10, 2)).toBe(10);
  });

  it('normalize maps a value in range to [0, 1] and clamps outside it', () => {
    expect(normalize(5, 0, 10)).toBe(0.5);
    expect(normalize(-5, 0, 10)).toBe(0);
    expect(normalize(15, 0, 10)).toBe(1);
  });
});
