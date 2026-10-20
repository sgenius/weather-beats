import { describe, expect, it } from 'vitest';
import type { WeatherSample } from '../contracts';
import { buildScorePlan } from '../sonification/buildScorePlan';
import { DEFAULT_MAPPING } from '../sonification/defaultMapping';
import { describePlanAt, sampleIndexAt } from './describePlanAt';

function hourlySamples(count: number): WeatherSample[] {
  return Array.from({ length: count }, (_, i) => ({
    epochMs: Date.parse('2026-09-24T12:00:00Z') + i * 3_600_000,
    temperatureC: i * 2, // warming, so each hour's pitch differs
    humidityPercent: 50,
    cloudCoverPercent: i * 5,
    precipitation: { amountMm: 0, type: 'none' as const },
  }));
}

const next12h = buildScorePlan(
  { timeZone: 'UTC', samples: hourlySamples(13) },
  DEFAULT_MAPPING,
  'next12h',
);
const now = buildScorePlan(
  { timeZone: 'UTC', samples: hourlySamples(1) },
  DEFAULT_MAPPING,
  'now',
);

function trackAt(seconds: number, trackId: string) {
  const found = describePlanAt(next12h, seconds).tracks.find(
    (t) => t.trackId === trackId,
  );
  if (!found) throw new Error(`No track "${trackId}"`);
  return found;
}

describe('describePlanAt', () => {
  it('reports the note and lever values the plan schedules for that second', () => {
    const plan = next12h.tracks.find((t) => t.trackId === 'foreground')!;
    const moment = trackAt(4.5, 'foreground');

    expect(moment.note).toEqual(plan.notes[4]);
    expect(moment.levers.muffling).toBeCloseTo(0.2); // hour 4: 20% cloud
    expect(moment.levers.reverbWetness).toBeCloseTo(0.5);
  });

  it('tracks a changing value across the timeline', () => {
    const early = trackAt(1, 'foreground').note!.midiNotes[0];
    const late = trackAt(10, 'foreground').note!.midiNotes[0];
    expect(late).toBeGreaterThan(early);
  });

  it('reports the chord on the polyphonic background track', () => {
    expect(trackAt(0, 'background').note?.midiNotes).toHaveLength(3);
  });

  it('holds the most recent percussion hit between beats', () => {
    const moment = trackAt(3.3, 'percussion');
    expect(moment.note).toBeDefined();
    expect(moment.note!.startSeconds).toBeLessThanOrEqual(3.3);
  });

  it('flags the fade-out and clamps out-of-range positions', () => {
    expect(describePlanAt(next12h, 11.9).isFadingOut).toBe(false);
    expect(describePlanAt(next12h, 12.5).isFadingOut).toBe(true);
    expect(describePlanAt(next12h, 99).seconds).toBe(13);
    expect(describePlanAt(next12h, -1).seconds).toBe(0);
  });

  it('keeps "now" mode steady across its whole 6s', () => {
    const first = describePlanAt(now, 0).tracks;
    const last = describePlanAt(now, 5.9).tracks;
    expect(last.find((t) => t.trackId === 'foreground')).toEqual(
      first.find((t) => t.trackId === 'foreground'),
    );
  });
});

describe('sampleIndexAt', () => {
  it('maps second n to forecast hour n in "next12h" mode', () => {
    expect(sampleIndexAt(next12h, 0, 13)).toBe(0);
    expect(sampleIndexAt(next12h, 7.8, 13)).toBe(7);
  });

  it('plays the +12h sample in the fade, then holds the last sample', () => {
    expect(sampleIndexAt(next12h, 12.5, 13)).toBe(12);
    expect(sampleIndexAt(next12h, 13, 13)).toBe(12);
    expect(sampleIndexAt(next12h, 9, 5)).toBe(4);
  });

  it('is always the first sample in "now" mode', () => {
    expect(sampleIndexAt(now, 4, 13)).toBe(0);
  });
});
