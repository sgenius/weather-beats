// Vocabulary + shape for "which weather value drives which sound lever(s),
// on which track(s)" - PLAN.md §4.2/§4.4. Data-driven so new states, levers
// or tracks are additions rather than edits (Open/Closed).

export type WeatherParameter =
  'temperature' | 'precipitation' | 'cloudCover' | 'humidity' | 'timeOfDay';

export type SoundLever =
  | 'pitch'
  | 'chord'
  | 'muffling'
  | 'timbre'
  | 'volume'
  | 'reverbWetness'
  | 'rhythmicDensity'
  | 'tempo';

/** The minimum 3-track arrangement from PLAN.md §4.4; more may be added later. */
export const DEFAULT_TRACK_IDS = [
  'percussion',
  'background',
  'foreground',
] as const;

/** A track identifier - one of the defaults above, or a future custom track. */
export type TrackId = string;

export interface LeverAssignment {
  parameter: WeatherParameter;
  lever: SoundLever;
  trackIds: TrackId[];
}

export interface MappingConfig {
  tracks: TrackId[];
  /** N:N assignments; PLAN.md §4.5 starts every parameter 1:1 with one lever. */
  assignments: LeverAssignment[];
}
