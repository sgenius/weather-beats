// Turns one TrackMoment into the text the "what you're hearing" panel shows
// for it - pure, so the wording is unit-testable without rendering.
import type { SoundLever } from '../contracts';
import type { TrackMoment } from './describePlanAt';

const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
];

// A full Record, so adding a SoundLever fails typechecking until it's
// given a label here too.
const LEVER_LABELS: Record<SoundLever, string> = {
  pitch: 'pitch',
  chord: 'chord',
  muffling: 'muffling',
  timbre: 'timbre',
  volume: 'volume',
  reverbWetness: 'reverb',
  rhythmicDensity: 'density',
  tempo: 'tempo',
};

/** Scientific pitch notation: MIDI 60 -> "C4". */
export function midiNoteName(midiNote: number): string {
  return `${NOTE_NAMES[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`;
}

function describeNotes(midiNotes: number[]): string {
  const names = midiNotes.map(midiNoteName).join(' ');
  if (midiNotes.length < 2) return names;
  // Assumes a root-position major or minor triad - the only chords
  // buildScorePlan's chordFor() generates today. Anything else (inversions,
  // 7ths, sus/dim/aug) would be mislabeled; revisit when Stage 4 widens
  // chord vocabulary.
  const quality = midiNotes[1] - midiNotes[0] === 4 ? 'major' : 'minor';
  return `${names} (${quality} chord)`;
}

const PERCENT = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
});

export function describeTrack({ note, levers }: TrackMoment): string {
  const parts = note
    ? [
        describeNotes(note.midiNotes),
        `loudness ${PERCENT.format(note.velocity)}`,
      ]
    : ['silent'];
  for (const [lever, value] of Object.entries(levers)) {
    parts.push(`${LEVER_LABELS[lever as SoundLever]} ${PERCENT.format(value)}`);
  }
  return parts.join(' · ');
}
