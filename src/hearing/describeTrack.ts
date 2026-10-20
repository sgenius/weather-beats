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
  const quality = midiNotes[1] - midiNotes[0] === 4 ? 'major' : 'minor';
  return `${names} (${quality} chord)`;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function describeTrack({ note, levers }: TrackMoment): string {
  const parts = note
    ? [describeNotes(note.midiNotes), `loudness ${percent(note.velocity)}`]
    : ['silent'];
  for (const [lever, value] of Object.entries(levers)) {
    parts.push(`${LEVER_LABELS[lever as SoundLever]} ${percent(value)}`);
  }
  return parts.join(' · ');
}
