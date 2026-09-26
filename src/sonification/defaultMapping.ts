// The proposed default 1:1 mapping (PLAN.md §4.5), tunable later in the
// sandbox (Stage 1 step 9). Chord quality (major/minor from day/night) isn't
// listed here because it's an arrangement decision of the background track
// itself, not a parameter->lever assignment in the default table.
//
// Deviates from §4.5's literal "precipitation -> rhythmic density + volume,
// none -> silent": percussion instead keeps a steady pulse locked to the
// shared tempo (PLAN.md §4.4, "all three lock to the same global rhythm"),
// and precipitation only scales that pulse's *volume* - so a dry stretch
// never risks going silent, which it would if a later renderer ever treated
// "volume" as a master gain rather than this track's own. Precipitation
// *type* (rain vs snow) choosing a different percussion instrument/timbre
// is a plausible later addition, not implemented here.
import { DEFAULT_TRACK_IDS, type MappingConfig } from '../contracts';

export const DEFAULT_MAPPING: MappingConfig = {
  tracks: [...DEFAULT_TRACK_IDS],
  assignments: [
    {
      parameter: 'temperature',
      lever: 'pitch',
      trackIds: ['foreground', 'background'],
    },
    { parameter: 'precipitation', lever: 'volume', trackIds: ['percussion'] },
    {
      parameter: 'cloudCover',
      lever: 'muffling',
      trackIds: ['foreground', 'background'],
    },
    {
      parameter: 'humidity',
      lever: 'reverbWetness',
      // No literal "master bus" track exists yet, so this reaches every
      // track - the closest equivalent until Stage 4 adds a real bus.
      trackIds: ['foreground', 'background', 'percussion'],
    },
  ],
};
