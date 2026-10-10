// The one seam between the pure ScorePlan core and real audio hardware
// (PLAN.md §3/§8) - the mapping logic never touches Tone.js directly, and
// tests mock this interface instead of the Web Audio API.
import type { ScorePlan } from '../contracts';

export interface AudioRenderer {
  /** Schedules and starts `plan` from the beginning, replacing any current
   * playback (PLAN.md §4.6: "(Re)start"). Calls `onEnded`, if given, once
   * the piece (including its fade-out) finishes naturally - never on an
   * explicit stop(). Resolves once playback has started, not once it has
   * finished. Requires a prior user gesture. */
  play(plan: ScorePlan, onEnded?: () => void): Promise<void>;
  /** Freezes playback in place; resume() continues from here. A note
   * already sounding at the moment of pause is cut short rather than
   * truly frozen mid-envelope - an accepted simplification for these
   * short (6-12s) pieces. */
  pause(): void;
  /** Continues playback from where pause() left off. */
  resume(): void;
  /** Halts playback and resets position to the start. */
  stop(): void;
  /** Sets the master volume, 0 (silent) to 1 (full), independent of the
   * piece's own fade-out envelope. */
  setVolume(volume: number): void;
}
