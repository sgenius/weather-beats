// Smoke-tests the Tone.js wiring (PLAN.md §8) behind a fully mocked 'tone'
// module - no real Web Audio API needed, and no claim about what it sounds
// like, only that play()/pause()/resume()/stop()/setVolume() schedule and
// call the right things on the right nodes.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScorePlan } from '../contracts';

class FakeNode {
  static instances: FakeNode[] = [];
  chain = vi.fn().mockReturnThis();
  connect = vi.fn().mockReturnThis();
  toDestination = vi.fn().mockReturnThis();
  constructor() {
    (this.constructor as typeof FakeNode).instances.push(this);
  }
}
class FakeSynth extends FakeNode {
  static instances: FakeSynth[] = [];
  triggerAttackRelease = vi.fn();
  triggerRelease = vi.fn();
}
class FakePolySynth extends FakeNode {
  static instances: FakePolySynth[] = [];
  triggerAttackRelease = vi.fn();
  releaseAll = vi.fn();
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
    rampTo: vi.fn(),
  };
}
class FakeLimiter extends FakeNode {}
class FakeTransport {
  schedule = vi.fn();
  scheduleOnce = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  pause = vi.fn();
  cancel = vi.fn();
}

const fakeTransport = new FakeTransport();

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getTransport: vi.fn(() => fakeTransport),
  Frequency: vi.fn((note: number) => ({ toFrequency: () => note * 10 })),
  PolySynth: FakePolySynth,
  Synth: FakeSynth,
  MembraneSynth: FakeSynth,
  Filter: FakeFilter,
  Freeverb: FakeFreeverb,
  Gain: FakeGain,
  Limiter: FakeLimiter,
}));

const { ToneAudioRenderer } = await import('./toneAudioRenderer');

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
            startSeconds: 2,
            durationSeconds: 1,
            midiNotes: [60, 64, 67],
            velocity: 0.7,
          },
        ],
        leverAutomation: {
          muffling: [{ timeSeconds: 2, value: 0.5 }],
          reverbWetness: [{ timeSeconds: 2, value: 0.3 }],
        },
      },
    ],
  } as ScorePlan;
}

/** Invokes every callback scheduled at `atTime` with `audioTime`, simulating
 * the Transport reaching that position. */
function fire(atTime: number, audioTime: number) {
  const calls = fakeTransport.schedule.mock.calls.filter(
    ([, t]) => t === atTime,
  );
  if (calls.length === 0) throw new Error(`Nothing scheduled at ${atTime}`);
  for (const [callback] of calls) {
    (callback as (time: number) => void)(audioTime);
  }
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
      FakeLimiter,
    ]) {
      cls.instances = [];
    }
  });

  it('starts the context, resets the transport, and schedules a chord on the background (poly) synth', async () => {
    const renderer = new ToneAudioRenderer();
    const tone = await import('tone');
    await renderer.play(planWithTrack('background'), vi.fn());

    expect(tone.start).toHaveBeenCalled();
    expect(fakeTransport.stop).toHaveBeenCalled();
    expect(fakeTransport.cancel).toHaveBeenCalledWith(0);

    fire(2, 12);
    expect(
      FakePolySynth.instances[0].triggerAttackRelease,
    ).toHaveBeenCalledWith([600, 640, 670], 1, 12, 0.7);
    expect(fakeTransport.start).toHaveBeenCalled();
  });

  it('schedules a note + automation on the foreground (mono) synth, and the gain fade-out', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'), vi.fn());

    fire(2, 12);
    expect(FakeSynth.instances[0].triggerAttackRelease).toHaveBeenCalledWith(
      600, // frequencyFor(60) via the mocked Frequency(60) -> 60 * 10
      1,
      12,
      0.7,
    );
    expect(
      FakeFilter.instances[0].frequency.setValueAtTime,
    ).toHaveBeenCalledWith(expect.any(Number), 12);
    expect(FakeFreeverb.instances[0].wet.setValueAtTime).toHaveBeenCalledWith(
      0.3,
      12,
    );

    const gain = FakeGain.instances[2]; // [0] headroom, [1] volume bus, [2] fade gain
    fire(0, 100);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 100);
    fire(6, 106);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 106);
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 107); // 106 + fadeOutSeconds (1)
  });

  it('calls onEnded once the piece (incl. fade-out) finishes, scheduled at durationSeconds + fadeOutSeconds', async () => {
    const onEnded = vi.fn();
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'), onEnded);

    const [callback, time] = fakeTransport.scheduleOnce.mock.calls[0];
    expect(time).toBe(7); // 6 + 1
    (callback as () => void)();
    expect(onEnded).toHaveBeenCalled();
  });

  it('pause() silences sounding notes and pauses the transport; resume() just restarts it', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'), vi.fn());

    renderer.pause();
    expect(FakeSynth.instances[0].triggerRelease).toHaveBeenCalled();
    expect(fakeTransport.pause).toHaveBeenCalled();

    renderer.resume();
    expect(fakeTransport.start).toHaveBeenCalledTimes(2); // once from play(), once from resume()
  });

  it('stop() silences sounding notes, stops, and clears the transport', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'), vi.fn());
    vi.clearAllMocks();

    renderer.stop();
    expect(FakeSynth.instances[0].triggerRelease).toHaveBeenCalled();
    expect(fakeTransport.stop).toHaveBeenCalled();
    expect(fakeTransport.cancel).toHaveBeenCalledWith(0);
  });

  it('setVolume() ramps the volume bus independently of the fade gain', () => {
    const renderer = new ToneAudioRenderer();
    renderer.setVolume(0.4);

    expect(FakeGain.instances[1].gain.rampTo).toHaveBeenCalledWith(0.4, 0.05);
  });

  it('reuses the same track nodes across repeated plays', async () => {
    const renderer = new ToneAudioRenderer();
    await renderer.play(planWithTrack('foreground'), vi.fn());
    await renderer.play(planWithTrack('foreground'), vi.fn());

    expect(FakeSynth.instances).toHaveLength(1);
    expect(FakeGain.instances).toHaveLength(3); // headroom + volumeGain + fadeGain, all lazy-created once
  });
});
