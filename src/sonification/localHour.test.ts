import { describe, expect, it } from 'vitest';
import { dayness, getLocalHour } from './localHour';

describe('getLocalHour', () => {
  it('reads the hour and minute in an explicit time zone', () => {
    expect(getLocalHour(Date.parse('2026-09-24T14:30:00Z'), 'UTC')).toBeCloseTo(
      14.5,
      5,
    );
    // Etc/GMT+7 = UTC-7 (a fixed offset, so no DST ambiguity in the test).
    expect(
      getLocalHour(Date.parse('2026-09-24T20:00:00Z'), 'Etc/GMT+7'),
    ).toBeCloseTo(13, 5);
  });
});

describe('dayness', () => {
  it('peaks at 1 at noon, bottoms out at 0 at midnight, and is symmetric between', () => {
    expect(dayness(12)).toBeCloseTo(1, 5);
    expect(dayness(0)).toBeCloseTo(0, 5);
    expect(dayness(24)).toBeCloseTo(0, 5);
    expect(dayness(6)).toBeCloseTo(0.5, 5);
    expect(dayness(18)).toBeCloseTo(0.5, 5);
  });
});
