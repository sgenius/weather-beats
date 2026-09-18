import { useState } from 'react';
import { DataDisplayPanel } from './display/DataDisplayPanel';
import { SandboxNowForm } from './sandbox/SandboxNowForm';
import {
  DEFAULT_SANDBOX_VALUES,
  sandboxValuesToTimeline,
  type SandboxNowValues,
} from './sandbox/sandboxTimeline';
import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  const [sandboxValues, setSandboxValues] = useState<SandboxNowValues>(
    DEFAULT_SANDBOX_VALUES,
  );
  const timeline = sandboxValuesToTimeline(sandboxValues);

  return (
    <ThemeProvider>
      <main>
        <h1>Weather Beats</h1>
        <p>
          Stage 1 in progress: the sandbox below stands in for live weather
          until the location and weather services land, so the display panel can
          be built and checked as we go.
        </p>
        <DataDisplayPanel timeline={timeline} />
        <SandboxNowForm values={sandboxValues} onChange={setSandboxValues} />
      </main>
    </ThemeProvider>
  );
}

export default App;
