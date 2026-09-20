import { useState } from 'react';
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
import { classifyWeatherState } from './theme/classifyWeatherState';
import { ThemeProvider } from './theme/ThemeProvider';
import { useWeatherStateTheme } from './theme/useWeatherStateTheme';
import { UnitToggle } from './units/UnitToggle';
import { useTemperatureUnit } from './units/useTemperatureUnit';

function AppContent() {
  const [sandboxValues, setSandboxValues] = useState<SandboxNowValues>(
    DEFAULT_SANDBOX_VALUES,
  );
  const timeline = sandboxValuesToTimeline(sandboxValues);
  const { location, setSearchedLocation } = useActiveLocation();
  const [unit, setUnit] = useTemperatureUnit();
  useWeatherStateTheme(classifyWeatherState(timeline.samples[0]));

  return (
    <main>
      <h1>Weather Beats</h1>
      <p>
        Stage 1 in progress: the sandbox below stands in for live weather until
        the location and weather services land. The page theme reflects the
        classified weather state (PLAN.md §5.1) - try adding rain or dropping
        the temperature below 10°C.
      </p>
      <LocationStatus location={location} />
      <LocationPicker onLocate={setSearchedLocation} />
      <UnitToggle unit={unit} onChange={setUnit} />
      <DataDisplayPanel timeline={timeline} unit={unit} />
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
