import { describe, expect, it } from 'vitest';
import { capitalize } from './text';

describe('capitalize', () => {
  it('upper-cases only the first character', () => {
    expect(capitalize('percussion')).toBe('Percussion');
    expect(capitalize('reverbWetness')).toBe('ReverbWetness');
    expect(capitalize('')).toBe('');
  });
});
