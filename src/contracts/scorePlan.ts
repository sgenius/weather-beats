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
  /** Normalised 0-1 value for the lever at this point in time. */
  value: number;
}

export interface TrackScore {
  trackId: TrackId;
  notes: NoteEvent[];
  leverAutomation: Partial<Record<SoundLever, LeverAutomationPoint[]>>;
}

export interface ScorePlan {
  mode: PlaybackMode;
  /** 6s for "now", 12s for "next12h" (PLAN.md §4.1), excluding the fade. */
  durationSeconds: number;
  fadeOutSeconds: number;
  /** Shared by every track so musicality never breaks (PLAN.md §4.4). */
  bpm: number;
  tracks: TrackScore[];
}
