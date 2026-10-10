import type { PlaybackMode } from '../contracts';

interface PlaybackModeToggleProps {
  mode: PlaybackMode;
  onChange: (mode: PlaybackMode) => void;
}

/** Picks which piece to play (PLAN.md §4.6): Now (6s) or Next 12h (12s). */
export function PlaybackModeToggle({
  mode,
  onChange,
}: PlaybackModeToggleProps) {
  return (
    <fieldset>
      <legend>Playback mode</legend>
      <label>
        <input
          type="radio"
          name="playback-mode"
          value="now"
          checked={mode === 'now'}
          onChange={() => onChange('now')}
        />
        Now (6s)
      </label>
      <label>
        <input
          type="radio"
          name="playback-mode"
          value="next12h"
          checked={mode === 'next12h'}
          onChange={() => onChange('next12h')}
        />
        Next 12h (12s)
      </label>
    </fieldset>
  );
}
