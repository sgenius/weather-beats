// WeatherTimeline + MappingConfig -> ScorePlan (PLAN.md §3/§4): deterministic
// and Tone.js-free, so the mapping logic is unit-testable without audio
// hardware. Realises the default 1:1 mapping (§4.5); MappingConfig only
// decides *which tracks* each lever reaches - the per-lever math itself is
// fixed for Stage 1 (Stage 4 generalises further). "Now" mode only for now;
// "next12h" is a follow-up PR.
import {
  DEFAULT_TRACK_IDS,
  type MappingConfig,
  type NoteEvent,
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

const TEMPERATURE_DOMAIN_C: [number, number] = [-10, 40];
const PRECIPITATION_DOMAIN_MM: [number, number] = [0, 10];
const BPM_RANGE: [number, number] = [80, 112];
const PERCUSSION_NOTE = 60;

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

function percussionHits(count: number, velocity: number): NoteEvent[] {
  if (count <= 0) return [];
  const spacing = 6 / count;
  return Array.from({ length: count }, (_, i) => ({
    startSeconds: i * spacing,
    durationSeconds: Math.min(0.15, spacing),
    midiNotes: [PERCUSSION_NOTE],
    velocity,
  }));
}

function emptyTrack(trackId: TrackId): TrackScore {
  return { trackId, notes: [], leverAutomation: {} };
}

function addAutomationPoint(
  track: TrackScore,
  lever: SoundLever,
  value: number,
) {
  (track.leverAutomation[lever] ??= []).push({ timeSeconds: 0, value });
}

/** Applies one WeatherSample to every mapped track/lever and returns the bpm. */
function applyLevers(
  tracks: Map<TrackId, TrackScore>,
  mapping: MappingConfig,
  sample: WeatherSample,
  timeZone: string | undefined,
): number {
  const tempValue = normalize(sample.temperatureC, ...TEMPERATURE_DOMAIN_C);
  const precipValue = normalize(
    sample.precipitation.amountMm,
    ...PRECIPITATION_DOMAIN_MM,
  );
  const cloudValue = sample.cloudCoverPercent / 100;
  const humidityValue = sample.humidityPercent / 100;
  const localHour = getLocalHour(sample.epochMs, timeZone);
  const isMajor = dayness(localHour) >= 0.5;

  for (const trackId of tracksFor(mapping, 'temperature', 'pitch')) {
    const track = tracks.get(trackId);
    if (!track) continue;
    const root = pitchFor(trackId, tempValue);
    const midiNotes =
      trackId === 'background' ? chordFor(root, isMajor) : [root];
    track.notes.push({
      startSeconds: 0,
      durationSeconds: 6,
      midiNotes,
      velocity: 0.7,
    });
  }
  for (const trackId of tracksFor(mapping, 'cloudCover', 'muffling')) {
    const track = tracks.get(trackId);
    if (track) addAutomationPoint(track, 'muffling', cloudValue);
  }
  for (const trackId of tracksFor(mapping, 'humidity', 'reverbWetness')) {
    const track = tracks.get(trackId);
    if (track) addAutomationPoint(track, 'reverbWetness', humidityValue);
  }
  for (const trackId of tracksFor(
    mapping,
    'precipitation',
    'rhythmicDensity',
  )) {
    const track = tracks.get(trackId);
    if (!track) continue;
    const count = Math.round(lerp(0, 8, precipValue));
    const velocity = lerp(0.3, 0.9, precipValue);
    track.notes.push(...percussionHits(count, velocity));
  }

  return Math.round(lerp(...BPM_RANGE, dayness(localHour)));
}

export function buildScorePlan(
  timeline: WeatherTimeline,
  mapping: MappingConfig,
  mode: 'now',
): ScorePlan {
  const trackIds =
    mapping.tracks.length > 0 ? mapping.tracks : [...DEFAULT_TRACK_IDS];
  const tracks = new Map<TrackId, TrackScore>(
    trackIds.map((id) => [id, emptyTrack(id)]),
  );
  const bpm = applyLevers(
    tracks,
    mapping,
    timeline.samples[0],
    timeline.timeZone,
  );

  return {
    mode,
    durationSeconds: 6,
    fadeOutSeconds: 1,
    bpm,
    tracks: [...tracks.values()],
  };
}
