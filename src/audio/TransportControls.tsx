export type TransportState = 'stopped' | 'playing' | 'paused';

interface TransportControlsProps {
  state: TransportState;
  onRestart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

/** (Re)start · Pause · Stop · Master volume (PLAN.md §4.6) - never
 * auto-starts; every control here requires a user gesture to act. */
export function TransportControls({
  state,
  onRestart,
  onPause,
  onResume,
  onStop,
  volume,
  onVolumeChange,
}: TransportControlsProps) {
  return (
    <div>
      <button type="button" onClick={onRestart}>
        {state === 'stopped' ? '▶ Play' : '↻ Restart'}
      </button>
      <button
        type="button"
        onClick={state === 'paused' ? onResume : onPause}
        disabled={state === 'stopped'}
      >
        {state === 'paused' ? '▶ Resume' : '⏸ Pause'}
      </button>
      <button type="button" onClick={onStop} disabled={state === 'stopped'}>
        ⏹ Stop
      </button>
      <label>
        Volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
      </label>
    </div>
  );
}
