// Smoke-tests the Tone.js wiring (PLAN.md §8) behind a fully mocked 'tone'
// module - no real Web Audio API needed, and no claim about what it sounds
// like, only that play() schedules the right calls on the right nodes.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScorePlan } from '../contracts';

class FakeNode {
  static instances: FakeNode[] = [];
  chain = vi.fn().mockReturnThis();
  toDestination = vi.fn().mockReturnThis();
  constructor() {
    (this.constructor as typeof FakeNode).instances.push(this);
  }
}
class FakeSynth extends FakeNode {
  static instances: FakeSynth[] = [];
  triggerAttackRelease = vi.fn();
}
class FakePolySynth extends FakeNode {
  static instances: FakePolySynth[] = [];
  triggerAttackRelease = vi.fn();
}
class FakeFilter extends FakeNode {
  static instances: FakeFilter[] = [];
  frequency = { setValueAtTime: vi.fn() };
}
class FakeFreeverb extends FakeNode {
  static instances: FakeFreeverb[] = [];
  wet = { setValueAtTime: vi.fn() };
}
class FakeGain extends FakeNode {
  static instances: FakeGain[] = [];
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn(() => 10),
  Frequency: vi.fn((note: number) => ({ toFrequency: () => note * 10 })),
  PolySynth: FakePolySynth,
  Synth: FakeSynth,
  MembraneSynth: FakeSynth,
  Filter: FakeFilter,
  Freeverb: FakeFreeverb,
  Gain: FakeGain,
}));

const { ToneAudioRenderer } = await import('./toneAudioRenderer');
const tone = await import('tone');

function planWithTrack(trackId: string): ScorePlan {
  return {
    mode: 'now',
    durationSeconds: 6,
    fadeOutSeconds: 1,
    bpm: 96,
    tracks: [
      {
        trackId,
        notes: [
          {
            startSeconds: 0,
            durationSeconds: 6,
            midiNotes: [60, 64, 67],
            velocity: 0.7,
          },
        ],
        leverAutomation: {
          muffling: [{ timeSeconds: 0, value: 0.5 }],
          reverbWetness: [{ timeSeconds: 0, value: 0.3 }],
        },
      },
    ],
  } as ScorePlan;
}

describe('ToneAudioRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const cls of [
      FakeSynth,
      FakePolySynth,
      FakeFilter,
      FakeFreeverb,
      FakeGain,
    ]) {
      cls.instances = [];
    }
  });

  it('starts the audio context and schedules a chord on the background (poly) synth', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('background'));

    expect(tone.start).toHaveBeenCalled();
    expect(
      FakePolySynth.instances[0].triggerAttackRelease,
    ).toHaveBeenCalledWith(
      [600, 640, 670], // frequencyFor(midi) via the mocked Frequency(midi) -> midi * 10
      6,
      10, // Tone.now() (10) + startSeconds (0)
      0.7,
    );
  });

  it('schedules a note + automation on the foreground (mono) synth, and fades the master gain out', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'));

    expect(FakeSynth.instances[0].triggerAttackRelease).toHaveBeenCalledWith(
      600, // frequencyFor(60) via the mocked Frequency(60) -> 60 * 10
      6,
      10, // Tone.now() (10) + startSeconds (0)
      0.7,
    );
    expect(
      FakeFilter.instances[0].frequency.setValueAtTime,
    ).toHaveBeenCalledWith(expect.any(Number), 10);
    expect(FakeFreeverb.instances[0].wet.setValueAtTime).toHaveBeenCalledWith(
      0.3,
      10,
    );

    const gain = FakeGain.instances[0];
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 10);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 16); // 10 + 6
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 17); // 16 + 1
  });

  it('reuses the same track nodes across repeated plays', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'));
    await renderer.play(planWithTrack('foreground'));

    expect(FakeSynth.instances).toHaveLength(1);
    expect(FakeGain.instances).toHaveLength(1);
  });
});
