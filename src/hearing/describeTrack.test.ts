import { describe, expect, it } from 'vitest';
import { describeTrack, midiNoteName } from './describeTrack';

const note = { startSeconds: 0, durationSeconds: 1, velocity: 0.7 };

describe('midiNoteName', () => {
  it('uses scientific pitch notation', () => {
    expect(midiNoteName(60)).toBe('C4');
    expect(midiNoteName(61)).toBe('C♯4');
    expect(midiNoteName(36)).toBe('C2');
    expect(midiNoteName(83)).toBe('B5');
  });
});

describe('describeTrack', () => {
  it('describes a single note, its loudness and each lever', () => {
    expect(
      describeTrack({
        trackId: 'foreground',
        note: { ...note, midiNotes: [67] },
        levers: { muffling: 0.4, reverbWetness: 0.55 },
      }),
    ).toBe('G4 · loudness 70% · muffling 40% · reverb 55%');
  });

  it('names a chord and its quality', () => {
    const chordOf = (midiNotes: number[]) =>
      describeTrack({
        trackId: 'bg',
        note: { ...note, midiNotes },
        levers: {},
      });
    expect(chordOf([48, 52, 55])).toBe('C3 E3 G3 (major chord) · loudness 70%');
    expect(chordOf([48, 51, 55])).toBe(
      'C3 D♯3 G3 (minor chord) · loudness 70%',
    );
  });

  it('says "silent" before a track has played anything', () => {
    expect(describeTrack({ trackId: 'x', levers: {} })).toBe('silent');
  });
});
