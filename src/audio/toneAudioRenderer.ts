// Tone.js implementation of AudioRenderer (PLAN.md §4.2/§4.4). Every
// ScorePlan timing field is already an absolute second offset (buildScorePlan
// baked bpm into it), so this schedules notes/automation straight onto the
// audio clock - no Tone.Transport needed. Per-track nodes are built lazily
// on first play() and reused, so merely constructing this class (e.g. at
// component mount) touches no audio hardware.
import * as Tone from 'tone';
import type { ScorePlan, TrackId, TrackScore } from '../contracts';
import type { AudioRenderer } from './AudioRenderer';

// Cutoff sweeps ~10kHz (bright) -> ~700Hz (muffled) on a log scale as the
// muffling value goes 0 -> 1 (PLAN.md §4.3).
const MUFFLING_CUTOFF_HZ: [number, number] = [10000, 700];

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
  reverb: Tone.Freeverb;
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
  const reverb = new Tone.Freeverb({ wet: 0 });
  const synth = synthFor(trackId);
  synth.chain(filter, reverb, destination);
  return { synth, filter, reverb };
}

function scheduleNotes(
  chain: TrackChain,
  track: TrackScore,
  startTime: number,
) {
  for (const note of track.notes) {
    const time = startTime + note.startSeconds;
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
  }
}

function scheduleAutomation(
  chain: TrackChain,
  track: TrackScore,
  startTime: number,
) {
  for (const point of track.leverAutomation.muffling ?? []) {
    chain.filter.frequency.setValueAtTime(
      muffledCutoffHz(point.value),
      startTime + point.timeSeconds,
    );
  }
  for (const point of track.leverAutomation.reverbWetness ?? []) {
    chain.reverb.wet.setValueAtTime(point.value, startTime + point.timeSeconds);
  }
}

export class ToneAudioRenderer implements AudioRenderer {
  private masterGain: Tone.Gain | undefined;
  private readonly chains = new Map<TrackId, TrackChain>();

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

  async play(plan: ScorePlan): Promise<void> {
    await Tone.start();
    this.masterGain ??= new Tone.Gain(1).toDestination();
    const startTime = Tone.now();
    const endTime = startTime + plan.durationSeconds;

    this.masterGain.gain.cancelScheduledValues(startTime);
    this.masterGain.gain.setValueAtTime(1, startTime);
    this.masterGain.gain.setValueAtTime(1, endTime);
    this.masterGain.gain.linearRampToValueAtTime(
      0,
      endTime + plan.fadeOutSeconds,
    );

    for (const track of plan.tracks) {
      const chain = this.chainFor(track.trackId, this.masterGain);
      scheduleNotes(chain, track, startTime);
      scheduleAutomation(chain, track, startTime);
    }
  }
}
