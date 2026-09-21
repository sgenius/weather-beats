import { describe, expect, it } from 'vitest';
import { formatNaiveLocalTime, toNaiveLocalIso } from './naiveLocalIso';

describe('toNaiveLocalIso', () => {
  it('formats a date as wall-clock time with no offset', () => {
    expect(toNaiveLocalIso(new Date(2026, 8, 21, 9, 5))).toBe(
      '2026-09-21T09:05',
    );
  });

  it('zero-pads single-digit month, day, hour, and minute', () => {
    expect(toNaiveLocalIso(new Date(2026, 0, 2, 3, 4))).toBe(
      '2026-01-02T03:04',
    );
  });
});

describe('formatNaiveLocalTime', () => {
  it('formats morning and afternoon hours with AM/PM', () => {
    expect(formatNaiveLocalTime('2026-09-21T09:05')).toBe('9:05 AM');
    expect(formatNaiveLocalTime('2026-09-21T14:32')).toBe('2:32 PM');
  });

  it('formats midnight and noon correctly', () => {
    expect(formatNaiveLocalTime('2026-09-21T00:00')).toBe('12:00 AM');
    expect(formatNaiveLocalTime('2026-09-21T12:00')).toBe('12:00 PM');
  });

  it('reads the hour and minute regardless of trailing seconds', () => {
    expect(formatNaiveLocalTime('2026-09-21T14:32:00')).toBe('2:32 PM');
  });
});
