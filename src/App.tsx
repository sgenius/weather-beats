import { useMemo, useState } from 'react';
import { ToneAudioRenderer } from './audio/toneAudioRenderer';
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
  // which requires the user gesture below (PLAN.md §4.6).
  const renderer = useMemo(() => new ToneAudioRenderer(), []);
  const [starting, setStarting] = useState(false);
  const activeTimeline =
    liveWeather.status === 'ready' && liveWeather.timeline
      ? liveWeather.timeline
      : sandboxTimeline;

  async function handlePlay() {
    setStarting(true);
    try {
      const plan = buildScorePlan(activeTimeline, DEFAULT_MAPPING, 'now');
      await renderer.play(plan);
    } finally {
      setStarting(false);
    }
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

      <button type="button" onClick={handlePlay} disabled={starting}>
        {starting ? 'Starting…' : '▶ Play (6s)'}
      </button>

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
