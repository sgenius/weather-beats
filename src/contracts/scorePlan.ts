// The deterministic, Tone.js-free output of WeatherTimeline + MappingConfig
// (PLAN.md §3/§4.6). Tone.js is only ever a renderer of this plan, kept
// behind an adapter so the mapping logic stays unit-testable.
import type { SoundLever, TrackId } from './mappingConfig';

export type PlaybackMode = 'now' | 'next12h';

export interface NoteEvent {
  startSeconds: number;
  durationSeconds: number;
  /** One or more simultaneous MIDI note numbers - a chord when > 1 (§4.2). */
  midiNotes: number[];
  velocity: number;
}

export interface LeverAutomationPoint {
  timeSeconds: number;
  /**
   * Normalised 0-1 position of the lever at this instant. Mapping that to
   * the lever's real-world range/unit (Hz, filter cutoff, wet mix, ...) is
   * the renderer's job (PLAN.md §4.2), not this contract's.
   */
  value: number;
}

export interface TrackScore {
  trackId: TrackId;
  notes: NoteEvent[];
  leverAutomation: Partial<Record<SoundLever, LeverAutomationPoint[]>>;
}

interface ScorePlanCommon {
  /** Shared by every track so musicality never breaks (PLAN.md §4.4). */
  bpm: number;
  tracks: TrackScore[];
  /** Both modes get the same 1s fade (PLAN.md §2). */
  fadeOutSeconds: 1;
}

/**
 * `durationSeconds` is pinned to `mode` by PLAN.md §4.1 (6s "now" / 12s
 * "next12h", excluding the fade) - a discriminated union instead of two
 * independent fields makes that pairing correct by construction, so a
 * `ScorePlan` claiming `mode: 'now'` and `durationSeconds: 12` can't be
 * constructed at all rather than merely being a bug once it is.
 */
export type ScorePlan = ScorePlanCommon &
  (
    | { mode: 'now'; durationSeconds: 6 }
    | { mode: 'next12h'; durationSeconds: 12 }
  );
