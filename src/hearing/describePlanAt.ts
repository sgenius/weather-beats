// "What is playing at second t" of a ScorePlan (PLAN.md §6: the audio's full
// non-audio equivalent). Pure and Tone.js-free, reading only the ScorePlan -
// so the "what you're hearing" panel shows exactly what the renderer plays,
// for any track or lever, rather than re-deriving it from the weather.
import type {
  NoteEvent,
  ScorePlan,
  SoundLever,
  TrackId,
  TrackScore,
} from '../contracts';

export interface TrackMoment {
  trackId: TrackId;
  /** The most recent note/chord to start at or before this instant.
   * Percussion hits are too short to be sounding at most instants, so the
   * latest one stands in for "what this track is doing now". */
  note?: NoteEvent;
  /** Each automated lever's value: its latest point at or before now. */
  levers: Partial<Record<SoundLever, number>>;
}

export interface PlanMoment {
  /** `seconds` clamped to the piece's full length, fade-out included. */
  seconds: number;
  isFadingOut: boolean;
  tracks: TrackMoment[];
}

function latestAtOrBefore<T>(
  items: readonly T[],
  timeOf: (item: T) => number,
  seconds: number,
): T | undefined {
  let latest: T | undefined;
  for (const item of items) {
    if (timeOf(item) <= seconds && (!latest || timeOf(item) >= timeOf(latest)))
      latest = item;
  }
  return latest;
}

function trackMomentAt(track: TrackScore, seconds: number): TrackMoment {
  const levers: Partial<Record<SoundLever, number>> = {};
  for (const [lever, points] of Object.entries(track.leverAutomation)) {
    const point = latestAtOrBefore(points, (p) => p.timeSeconds, seconds);
    if (point) levers[lever as SoundLever] = point.value;
  }
  return {
    trackId: track.trackId,
    note: latestAtOrBefore(track.notes, (n) => n.startSeconds, seconds),
    levers,
  };
}

export function describePlanAt(plan: ScorePlan, seconds: number): PlanMoment {
  const end = plan.durationSeconds + plan.fadeOutSeconds;
  const clamped = Math.min(Math.max(seconds, 0), end);
  return {
    seconds: clamped,
    isFadingOut: clamped >= plan.durationSeconds,
    tracks: plan.tracks.map((track) => trackMomentAt(track, clamped)),
  };
}

/**
 * Which WeatherTimeline sample is playing at `seconds`: always samples[0]
 * in "now" mode; hour n at second n in "next12h" (PLAN.md §4.1) - so the
 * +12h sample plays during the fade - holding the last one after that.
 */
export function sampleIndexAt(
  plan: ScorePlan,
  seconds: number,
  sampleCount: number,
): number {
  if (plan.mode === 'now' || sampleCount <= 1) return 0;
  const hour = Math.floor(Math.max(seconds, 0));
  return Math.min(hour, sampleCount - 1);
}
