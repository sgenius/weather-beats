// The one seam between the pure ScorePlan core and real audio hardware
// (PLAN.md §3/§8) - the mapping logic never touches Tone.js directly, and
// tests mock this interface instead of the Web Audio API.
import type { ScorePlan } from '../contracts';

export interface AudioRenderer {
  /** Schedules and starts `plan` from "now". Resolves once playback has
   * started (not once it has finished). Requires a prior user gesture. */
  play(plan: ScorePlan): Promise<void>;
}
