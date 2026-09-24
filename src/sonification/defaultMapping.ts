// The proposed default 1:1 mapping (PLAN.md §4.5), tunable later in the
// sandbox (Stage 1 step 9). Chord quality (major/minor from day/night) isn't
// listed here because it's an arrangement decision of the background track
// itself, not a parameter->lever assignment in the default table.
import { DEFAULT_TRACK_IDS, type MappingConfig } from '../contracts';

export const DEFAULT_MAPPING: MappingConfig = {
  tracks: [...DEFAULT_TRACK_IDS],
  assignments: [
    {
      parameter: 'temperature',
      lever: 'pitch',
      trackIds: ['foreground', 'background'],
    },
    {
      parameter: 'precipitation',
      lever: 'rhythmicDensity',
      trackIds: ['percussion'],
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
