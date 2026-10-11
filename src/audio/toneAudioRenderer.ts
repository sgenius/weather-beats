// Tone.js implementation of AudioRenderer (PLAN.md §4.2/§4.4/§4.6). Notes
// and automation are scheduled on Tone.Transport (not raw Tone.now()
// offsets) specifically so pause()/resume()/stop() work: the Transport's
// own clock - not individual notes - is what's actually paused/rewound.
import * as Tone from 'tone';
import type { ScorePlan, TrackId, TrackScore } from '../contracts';
import type { AudioRenderer } from './AudioRenderer';

// Cutoff sweeps ~10kHz (bright) -> ~700Hz (muffled) on a log scale as the
// muffling value goes 0 -> 1 (PLAN.md §4.3).
const MUFFLING_CUTOFF_HZ: [number, number] = [10000, 700];
const VOLUME_RAMP_SECONDS = 0.05;

function frequencyFor(midiNote: number): number {
  return Tone.Frequency(midiNote, 'midi').toFrequency();
}

function muffledCutoffHz(value: number): number {
  const [bright, dark] = MUFFLING_CUTOFF_HZ;
  return bright * Math.pow(dark / bright, value);
}

type TrackSynth = Tone.PolySynth | Tone.Synth | Tone.MembraneSynth;

interface TrackChain {
  synth: TrackSynth;
  filter: Tone.Filter;
  reverb: Tone.Reverb;
}

function synthFor(trackId: TrackId): TrackSynth {
  if (trackId === 'background') return new Tone.PolySynth(Tone.Synth);
  if (trackId === 'percussion') return new Tone.MembraneSynth();
  return new Tone.Synth();
}

function buildChain(
  trackId: TrackId,
  destination: Tone.ToneAudioNode,
): TrackChain {
  const filter = new Tone.Filter(MUFFLING_CUTOFF_HZ[0], 'lowpass');
  // Tone.Reverb (convolution, native ConvolverNode) over Tone.Freeverb
  // (AudioWorkletNode-based): the worklet only connects its input to its
  // output once its module finishes loading asynchronously, so any note
  // scheduled before that lands in a dead end - the first play after a
  // page load would glitch or drop out while every later one (same
  // now-ready chain) sounds normal. Reverb's `ready` promise lets play()
  // wait that out explicitly instead.
  const reverb = new Tone.Reverb({ wet: 0 });
  const synth = synthFor(trackId);
  synth.chain(filter, reverb, destination);
  return { synth, filter, reverb };
}

/** Cuts off whatever the chain's synth is currently sounding, right now. */
function silence(chain: TrackChain): void {
  if (chain.synth instanceof Tone.PolySynth) {
    chain.synth.releaseAll();
  } else {
    chain.synth.triggerRelease();
  }
}

function scheduleNotes(chain: TrackChain, track: TrackScore): void {
  const transport = Tone.getTransport();
  for (const note of track.notes) {
    transport.schedule((time) => {
      if (chain.synth instanceof Tone.PolySynth) {
        chain.synth.triggerAttackRelease(
          note.midiNotes.map(frequencyFor),
          note.durationSeconds,
          time,
          note.velocity,
        );
      } else {
        chain.synth.triggerAttackRelease(
          frequencyFor(note.midiNotes[0]),
          note.durationSeconds,
          time,
          note.velocity,
        );
      }
    }, note.startSeconds);
  }
}

function scheduleAutomation(chain: TrackChain, track: TrackScore): void {
  const transport = Tone.getTransport();
  for (const point of track.leverAutomation.muffling ?? []) {
    transport.schedule((time) => {
      chain.filter.frequency.setValueAtTime(muffledCutoffHz(point.value), time);
    }, point.timeSeconds);
  }
  for (const point of track.leverAutomation.reverbWetness ?? []) {
    transport.schedule((time) => {
      chain.reverb.wet.setValueAtTime(point.value, time);
    }, point.timeSeconds);
  }
}

export class ToneAudioRenderer implements AudioRenderer {
  private fadeGain: Tone.Gain | undefined;
  private volumeGain: Tone.Gain | undefined;
  private readonly chains = new Map<TrackId, TrackChain>();

  private ensureBus(): { fadeGain: Tone.Gain; volumeGain: Tone.Gain } {
    if (!this.volumeGain) {
      // Three simultaneous tracks (one of them a chord) summed at each
      // note's own velocity clip hard past 0dBFS. A compressor-based
      // limiter alone can't catch that - its attack reacts to level over
      // time, not an instantaneous sample peak - so fixed headroom comes
      // first; the limiter after it is a safety net, not the fix itself.
      const limiter = new Tone.Limiter(-3).toDestination();
      const headroom = new Tone.Gain(0.5).connect(limiter);
      this.volumeGain = new Tone.Gain(1).connect(headroom);
    }
    this.fadeGain ??= new Tone.Gain(1).connect(this.volumeGain);
    return { fadeGain: this.fadeGain, volumeGain: this.volumeGain };
  }

  private chainFor(
    trackId: TrackId,
    destination: Tone.ToneAudioNode,
  ): TrackChain {
    let chain = this.chains.get(trackId);
    if (!chain) {
      chain = buildChain(trackId, destination);
      this.chains.set(trackId, chain);
    }
    return chain;
  }

  async play(plan: ScorePlan, onEnded?: () => void): Promise<void> {
    await Tone.start();
    this.stop();
    const { fadeGain } = this.ensureBus();
    const transport = Tone.getTransport();

    // Param automation takes an absolute audio-context time, not a
    // Transport position, so it's scheduled via transport.schedule() too -
    // its callback receives the real context time for that position.
    transport.schedule((time) => fadeGain.gain.setValueAtTime(1, time), 0);
    transport.schedule(
      (time) => fadeGain.gain.setValueAtTime(1, time),
      plan.durationSeconds,
    );
    transport.schedule(
      (time) =>
        fadeGain.gain.linearRampToValueAtTime(0, time + plan.fadeOutSeconds),
      plan.durationSeconds,
    );

    const chains = plan.tracks.map((track) =>
      this.chainFor(track.trackId, fadeGain),
    );
    // Wait out each chain's reverb startup (a no-op once already ready) so
    // no note is ever scheduled through a reverb that isn't connected yet.
    await Promise.all(chains.map((chain) => chain.reverb.ready));

    plan.tracks.forEach((track, i) => {
      scheduleNotes(chains[i], track);
      scheduleAutomation(chains[i], track);
    });

    transport.scheduleOnce(
      () => onEnded?.(),
      plan.durationSeconds + plan.fadeOutSeconds,
    );
    transport.start();
  }

  pause(): void {
    for (const chain of this.chains.values()) {
      silence(chain);
    }
    Tone.getTransport().pause();
  }

  resume(): void {
    Tone.getTransport().start();
  }

  stop(): void {
    for (const chain of this.chains.values()) {
      silence(chain);
    }
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel(0);
  }

  setVolume(volume: number): void {
    const { volumeGain } = this.ensureBus();
    volumeGain.gain.rampTo(volume, VOLUME_RAMP_SECONDS);
  }
}
