import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRACK_IDS,
  type MappingConfig,
  type ScorePlan,
  type WeatherTimeline,
} from './index';

describe('core contracts', () => {
  it('accepts a single-sample WeatherTimeline as the no-forecast fallback', () => {
    const timeline: WeatherTimeline = {
      localTimeIso: '2026-09-13T08:00:00-07:00',
      samples: [
        {
          hourOffset: 0,
          temperatureC: 18,
          humidityPercent: 55,
          cloudCoverPercent: 20,
          precipitation: { amountMm: 0, type: 'none' },
        },
      ],
    };

    expect(timeline.samples).toHaveLength(1);
    expect(timeline.samples[0].hourOffset).toBe(0);
  });

  it('accepts a 1:1 MappingConfig over the default 3-track arrangement', () => {
    const mapping: MappingConfig = {
      tracks: [...DEFAULT_TRACK_IDS],
      assignments: [
        {
          parameter: 'temperature',
          lever: 'pitch',
          trackIds: ['foreground', 'background'],
        },
        {
          parameter: 'precipitation',
          lever: 'rhythmicDensity',
          trackIds: ['percussion'],
        },
      ],
    };

    expect(mapping.tracks).toEqual(['percussion', 'background', 'foreground']);
    expect(mapping.assignments).toHaveLength(2);
  });

  it('describes a finite Now piece with a shared tempo across tracks', () => {
    const plan: ScorePlan = {
      mode: 'now',
      durationSeconds: 6,
      fadeOutSeconds: 1,
      bpm: 96,
      tracks: [
        {
          trackId: 'foreground',
          notes: [
            {
              startSeconds: 0,
              durationSeconds: 1,
              midiNotes: [60],
              velocity: 0.8,
            },
          ],
          leverAutomation: {
            pitch: [{ timeSeconds: 0, value: 0.5 }],
          },
        },
      ],
    };

    expect(plan.durationSeconds + plan.fadeOutSeconds).toBe(7);
    expect(plan.tracks[0].notes[0].midiNotes).toContain(60);
  });
});
