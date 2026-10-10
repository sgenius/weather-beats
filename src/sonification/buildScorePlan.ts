// WeatherTimeline + MappingConfig -> ScorePlan (PLAN.md §3/§4): deterministic
// and Tone.js-free. Realises the default 1:1 mapping (§4.5) - MappingConfig
// only decides which tracks each lever reaches, fixed for Stage 1. "Now"
// plays only samples[0] as one long note; "next12h" plays every sample as
// its own note/automation point at second == hour offset (§4.1).
import {
  DEFAULT_TRACK_IDS,
  type MappingConfig,
  type NoteEvent,
  type PlaybackMode,
  type ScorePlan,
  type SoundLever,
  type TrackId,
  type TrackScore,
  type WeatherParameter,
  type WeatherSample,
  type WeatherTimeline,
} from '../contracts';
import { dayness, getLocalHour } from './localHour';
import { lerp, normalize } from './mathHelpers';

const TEMPERATURE_DOMAIN_C: [number, number] = [-40, 60];
const PRECIPITATION_DOMAIN_MM: [number, number] = [0, 10];
// Day/night is already audible via chord quality (major/minor, below) -
// a few bpm either way isn't a reliable enough signal on its own, so
// tempo stays constant instead of also riding on dayness.
const BPM = 96;
const PERCUSSION_VELOCITY_RANGE: [number, number] = [0.2, 0.9];
const PERCUSSION_NOTE = 60;
const NOW_DURATION_SECONDS = 6;
const NEXT12H_DURATION_SECONDS = 12;
const NEXT12H_NOTE_SECONDS = 1;

const PITCH_RANGES: Partial<Record<TrackId, [number, number]>> = {
  foreground: [60, 84],
  background: [36, 60],
};

function tracksFor(
  mapping: MappingConfig,
  parameter: WeatherParameter,
  lever: SoundLever,
): TrackId[] {
  return mapping.assignments
    .filter((a) => a.parameter === parameter && a.lever === lever)
    .flatMap((a) => a.trackIds);
}

function pitchFor(trackId: TrackId, normalizedTemp: number): number {
  const [min, max] = PITCH_RANGES[trackId] ?? PITCH_RANGES.foreground!;
  return Math.round(lerp(min, max, normalizedTemp));
}

/** Only the background track is the polyphonic pad (PLAN.md §4.4). */
function chordFor(root: number, isMajor: boolean): number[] {
  return [root, root + (isMajor ? 4 : 3), root + 7];
}

/** An even, bpm-locked pulse across `durationSeconds`, never empty -
 * percussion (and the shared tempo) is always present; only each beat's
 * `velocityAt` its own start time varies. */
function percussionPulse(
  durationSeconds: number,
  count: number,
  velocityAt: (startSeconds: number) => number,
): NoteEvent[] {
  const spacing = durationSeconds / count;
  return Array.from({ length: count }, (_, i) => {
    const startSeconds = i * spacing;
    return {
      startSeconds,
      durationSeconds: Math.min(0.15, spacing),
      midiNotes: [PERCUSSION_NOTE],
      velocity: velocityAt(startSeconds),
    };
  });
}

function emptyTrack(trackId: TrackId): TrackScore {
  return { trackId, notes: [], leverAutomation: {} };
}

function addAutomationPoint(
  track: TrackScore,
  lever: SoundLever,
  value: number,
  timeSeconds: number,
) {
  (track.leverAutomation[lever] ??= []).push({ timeSeconds, value });
}

/** Applies one sample's temperature/cloud/humidity levers at `startSeconds`. */
function applySampleLevers(
  tracks: Map<TrackId, TrackScore>,
  mapping: MappingConfig,
  sample: WeatherSample,
  timeZone: string | undefined,
  startSeconds: number,
  noteDurationSeconds: number,
): void {
  const tempValue = normalize(sample.temperatureC, ...TEMPERATURE_DOMAIN_C);
  const cloudValue = sample.cloudCoverPercent / 100;
  const humidityValue = sample.humidityPercent / 100;
  const isMajor = dayness(getLocalHour(sample.epochMs, timeZone)) >= 0.5;

  for (const trackId of tracksFor(mapping, 'temperature', 'pitch')) {
    const track = tracks.get(trackId);
    if (!track) continue;
    const root = pitchFor(trackId, tempValue);
    const midiNotes =
      trackId === 'background' ? chordFor(root, isMajor) : [root];
    track.notes.push({
      startSeconds,
      durationSeconds: noteDurationSeconds,
      midiNotes,
      velocity: 0.7,
    });
  }
  for (const trackId of tracksFor(mapping, 'cloudCover', 'muffling')) {
    const track = tracks.get(trackId);
    if (track) addAutomationPoint(track, 'muffling', cloudValue, startSeconds);
  }
  for (const trackId of tracksFor(mapping, 'humidity', 'reverbWetness')) {
    const track = tracks.get(trackId);
    if (track)
      addAutomationPoint(track, 'reverbWetness', humidityValue, startSeconds);
  }
}

/** Steady, bpm-locked pulse (PLAN.md §4.4) across the whole plan - each
 * beat's volume reflects the sample covering the second it falls in;
 * precipitation never silences the pulse itself. */
function applyPercussion(
  tracks: Map<TrackId, TrackScore>,
  mapping: MappingConfig,
  samples: WeatherSample[],
  bpm: number,
  durationSeconds: number,
): void {
  const beatCount = Math.max(1, Math.round((bpm / 60) * durationSeconds));
  const notes = percussionPulse(durationSeconds, beatCount, (startSeconds) => {
    const sampleIndex = Math.min(Math.floor(startSeconds), samples.length - 1);
    const precipValue = normalize(
      samples[sampleIndex].precipitation.amountMm,
      ...PRECIPITATION_DOMAIN_MM,
    );
    return lerp(...PERCUSSION_VELOCITY_RANGE, precipValue);
  });
  for (const trackId of tracksFor(mapping, 'precipitation', 'volume')) {
    const track = tracks.get(trackId);
    if (track) track.notes.push(...notes);
  }
}

export function buildScorePlan(
  timeline: WeatherTimeline,
  mapping: MappingConfig,
  mode: PlaybackMode,
): ScorePlan {
  const trackIds =
    mapping.tracks.length > 0 ? mapping.tracks : [...DEFAULT_TRACK_IDS];
  const tracks = new Map<TrackId, TrackScore>(
    trackIds.map((id) => [id, emptyTrack(id)]),
  );

  const samples =
    mode === 'now' ? timeline.samples.slice(0, 1) : timeline.samples;
  const durationSeconds =
    mode === 'now' ? NOW_DURATION_SECONDS : NEXT12H_DURATION_SECONDS;

  samples.forEach((sample, i) => {
    const startSeconds = mode === 'now' ? 0 : i;
    const noteDurationSeconds =
      mode === 'now' ? durationSeconds : NEXT12H_NOTE_SECONDS;
    applySampleLevers(
      tracks,
      mapping,
      sample,
      timeline.timeZone,
      startSeconds,
      noteDurationSeconds,
    );
  });
  applyPercussion(tracks, mapping, samples, BPM, durationSeconds);

  const trackScores = [...tracks.values()];
  return mode === 'now'
    ? {
        mode,
        durationSeconds: NOW_DURATION_SECONDS,
        fadeOutSeconds: 1,
        bpm: BPM,
        tracks: trackScores,
      }
    : {
        mode,
        durationSeconds: NEXT12H_DURATION_SECONDS,
        fadeOutSeconds: 1,
        bpm: BPM,
        tracks: trackScores,
      };
}
