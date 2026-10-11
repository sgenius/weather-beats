import { useMemo, useState } from 'react';
import type { PlaybackMode } from './contracts';
import { PlaybackModeToggle } from './audio/PlaybackModeToggle';
import { ToneAudioRenderer } from './audio/toneAudioRenderer';
import {
  TransportControls,
  type TransportState,
} from './audio/TransportControls';
import { DataDisplayPanel } from './display/DataDisplayPanel';
import { LocationPicker } from './location/LocationPicker';
import { LocationStatus } from './location/LocationStatus';
import { useActiveLocation } from './location/useActiveLocation';
import { SandboxNowForm } from './sandbox/SandboxNowForm';
import {
  DEFAULT_SANDBOX_VALUES,
  sandboxValuesToTimeline,
  type SandboxNowValues,
} from './sandbox/sandboxTimeline';
import { buildScorePlan } from './sonification/buildScorePlan';
import { DEFAULT_MAPPING } from './sonification/defaultMapping';
import { classifyWeatherState } from './theme/classifyWeatherState';
import { ThemeProvider } from './theme/ThemeProvider';
import { useWeatherStateTheme } from './theme/useWeatherStateTheme';
import { UnitToggle } from './units/UnitToggle';
import { useTemperatureUnit } from './units/useTemperatureUnit';
import { useWeatherTimeline } from './weather/useWeatherTimeline';

function AppContent() {
  const [sandboxValues, setSandboxValues] = useState<SandboxNowValues>(
    DEFAULT_SANDBOX_VALUES,
  );
  const sandboxTimeline = sandboxValuesToTimeline(sandboxValues);
  const { location, setSearchedLocation } = useActiveLocation();
  const [unit, setUnit] = useTemperatureUnit();
  const liveWeather = useWeatherTimeline(location.coordinates);
  useWeatherStateTheme(classifyWeatherState(sandboxTimeline.samples[0]));

  // Lazy: constructing this touches no audio hardware until play() runs,
  // which requires a user gesture (PLAN.md §4.6) - never auto-started.
  const renderer = useMemo(() => new ToneAudioRenderer(), []);
  const [mode, setMode] = useState<PlaybackMode>('now');
  const [transportState, setTransportState] =
    useState<TransportState>('stopped');
  const [volume, setVolume] = useState(1);
  const activeTimeline =
    liveWeather.status === 'ready' && liveWeather.timeline
      ? liveWeather.timeline
      : sandboxTimeline;

  async function handleRestart() {
    setTransportState('playing');
    const plan = buildScorePlan(activeTimeline, DEFAULT_MAPPING, mode);
    await renderer.play(plan, () => setTransportState('stopped'));
  }

  function handlePause() {
    renderer.pause();
    setTransportState('paused');
  }

  function handleResume() {
    renderer.resume();
    setTransportState('playing');
  }

  function handleStop() {
    renderer.stop();
    setTransportState('stopped');
  }

  function handleVolumeChange(newVolume: number) {
    setVolume(newVolume);
    renderer.setVolume(newVolume);
  }

  return (
    <main>
      <h1>Weather Beats</h1>
      <p>
        Stage 1 in progress. The page theme reflects the classified weather
        state (PLAN.md §5.1) - try adding rain or dropping the temperature below
        10°C in the sandbox.
      </p>
      <LocationStatus location={location} />
      <LocationPicker onLocate={setSearchedLocation} />
      <UnitToggle unit={unit} onChange={setUnit} />

      <PlaybackModeToggle mode={mode} onChange={setMode} />
      <TransportControls
        state={transportState}
        restartDisabled={liveWeather.status === 'loading'}
        onRestart={handleRestart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      {liveWeather.status === 'loading' && <p>Loading weather…</p>}
      {liveWeather.status === 'error' && (
        <p role="alert">{liveWeather.error}</p>
      )}
      {liveWeather.status === 'ready' && liveWeather.timeline && (
        <DataDisplayPanel
          timeline={liveWeather.timeline}
          unit={unit}
          heading="Live weather"
        />
      )}

      <DataDisplayPanel
        timeline={sandboxTimeline}
        unit={unit}
        heading="Sandbox preview"
      />
      <SandboxNowForm values={sandboxValues} onChange={setSandboxValues} />
    </main>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
