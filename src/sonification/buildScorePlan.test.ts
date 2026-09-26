import { describe, expect, it } from 'vitest';
import type { WeatherSample, WeatherTimeline } from '../contracts';
import { buildScorePlan } from './buildScorePlan';
import { DEFAULT_MAPPING } from './defaultMapping';

function sample(overrides: Partial<WeatherSample> = {}): WeatherSample {
  return {
    epochMs: Date.parse('2026-09-24T12:00:00Z'), // noon UTC
    temperatureC: 15,
    humidityPercent: 50,
    cloudCoverPercent: 50,
    precipitation: { amountMm: 0, type: 'none' },
    ...overrides,
  };
}

function timeline(samples: WeatherSample[]): WeatherTimeline {
  return { timeZone: 'UTC', samples };
}

function track(plan: ReturnType<typeof buildScorePlan>, trackId: string) {
  const found = plan.tracks.find((t) => t.trackId === trackId);
  if (!found) throw new Error(`No track "${trackId}" in plan`);
  return found;
}

describe('buildScorePlan - "now" mode', () => {
  it('produces a 6s plan with a 1s fade and one note per pitch-mapped track', () => {
    const plan = buildScorePlan(timeline([sample()]), DEFAULT_MAPPING, 'now');
    expect(plan.mode).toBe('now');
    expect(plan.durationSeconds).toBe(6);
    expect(plan.fadeOutSeconds).toBe(1);

    const foreground = track(plan, 'foreground');
    expect(foreground.notes).toHaveLength(1);
    expect(foreground.notes[0]).toMatchObject({
      startSeconds: 0,
      durationSeconds: 6,
    });
  });

  it('maps colder/hotter temperatures to progressively higher pitch', () => {
    const pitches = [-10, 15, 40].map((temperatureC) => {
      const plan = buildScorePlan(
        timeline([sample({ temperatureC })]),
        DEFAULT_MAPPING,
        'now',
      );
      return track(plan, 'foreground').notes[0].midiNotes[0];
    });
    expect(pitches[0]).toBeLessThan(pitches[1]);
    expect(pitches[1]).toBeLessThan(pitches[2]);
  });

  it('gives the background chord major-by-day/minor-by-night, and a faster bpm by day', () => {
    const day = buildScorePlan(
      timeline([sample({ epochMs: Date.parse('2026-09-24T12:00:00Z') })]),
      DEFAULT_MAPPING,
      'now',
    );
    const night = buildScorePlan(
      timeline([sample({ epochMs: Date.parse('2026-09-24T00:00:00Z') })]),
      DEFAULT_MAPPING,
      'now',
    );

    const dayChord = track(day, 'background').notes[0].midiNotes;
    const nightChord = track(night, 'background').notes[0].midiNotes;
    expect(dayChord[1] - dayChord[0]).toBe(4); // major third
    expect(nightChord[1] - nightChord[0]).toBe(3); // minor third
    expect(day.bpm).toBeGreaterThan(night.bpm);
  });

  it('keeps a steady percussion pulse regardless of precipitation, scaling only its loudness', () => {
    const dry = buildScorePlan(
      timeline([sample({ precipitation: { amountMm: 0, type: 'none' } })]),
      DEFAULT_MAPPING,
      'now',
    );
    const heavy = buildScorePlan(
      timeline([sample({ precipitation: { amountMm: 9, type: 'rain' } })]),
      DEFAULT_MAPPING,
      'now',
    );

    const dryNotes = track(dry, 'percussion').notes;
    const heavyNotes = track(heavy, 'percussion').notes;
    // Never silent - a dry stretch must not risk silencing the whole piece
    // if a later renderer ever treats "volume" as a master gain.
    expect(dryNotes.length).toBeGreaterThan(0);
    expect(dryNotes.length).toBe(heavyNotes.length); // same bpm, same pulse
    expect(heavyNotes[0].velocity).toBeGreaterThan(dryNotes[0].velocity);
  });

  it('locks the percussion pulse count to the shared tempo', () => {
    const day = buildScorePlan(
      timeline([sample({ epochMs: Date.parse('2026-09-24T12:00:00Z') })]),
      DEFAULT_MAPPING,
      'now',
    );
    const night = buildScorePlan(
      timeline([sample({ epochMs: Date.parse('2026-09-24T00:00:00Z') })]),
      DEFAULT_MAPPING,
      'now',
    );
    expect(track(day, 'percussion').notes.length).toBeGreaterThan(
      track(night, 'percussion').notes.length,
    );
  });

  it('maps cloud cover and humidity to in-range [0,1] automation on the mapped tracks', () => {
    const plan = buildScorePlan(
      timeline([sample({ cloudCoverPercent: 80, humidityPercent: 30 })]),
      DEFAULT_MAPPING,
      'now',
    );

    for (const trackId of ['foreground', 'background']) {
      const points = track(plan, trackId).leverAutomation.muffling!;
      expect(points).toEqual([{ timeSeconds: 0, value: 0.8 }]);
    }
    for (const trackId of ['foreground', 'background', 'percussion']) {
      const points = track(plan, trackId).leverAutomation.reverbWetness!;
      expect(points).toEqual([{ timeSeconds: 0, value: 0.3 }]);
    }
  });

  it('only automates the tracks a custom mapping actually targets', () => {
    const customMapping = {
      tracks: DEFAULT_MAPPING.tracks,
      assignments: [
        {
          parameter: 'cloudCover' as const,
          lever: 'muffling' as const,
          trackIds: ['foreground'],
        },
      ],
    };
    const plan = buildScorePlan(timeline([sample()]), customMapping, 'now');
    expect(track(plan, 'foreground').leverAutomation.muffling).toBeDefined();
    expect(track(plan, 'background').leverAutomation.muffling).toBeUndefined();
  });
});
