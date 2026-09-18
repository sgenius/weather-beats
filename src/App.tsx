import type { WeatherTimeline } from './contracts';
import { DataDisplayPanel } from './display/DataDisplayPanel';
import { ThemeProvider } from './theme/ThemeProvider';

// Placeholder until the sandbox input form and the live weather service
// (Stage 1 steps 1b/4) land - lets the display panel be built and checked
// against realistic values before either exists.
const PLACEHOLDER_TIMELINE: WeatherTimeline = {
  localTimeIso: new Date(2026, 8, 13, 8, 0).toISOString(),
  samples: [
    {
      epochMs: new Date(2026, 8, 13, 8, 0).getTime(),
      temperatureC: 18,
      humidityPercent: 62,
      cloudCoverPercent: 40,
      precipitation: { type: 'none', amountMm: 0 },
    },
  ],
  todayTemperatureRangeC: { min: 14, max: 23 },
  todayHumidityRangePercent: { min: 48, max: 78 },
};

function App() {
  return (
    <ThemeProvider>
      <main>
        <h1>Weather Beats</h1>
        <p>
          Stage 1 in progress: the panel below reads a placeholder timeline
          until the sandbox input and the live weather service land.
        </p>
        <DataDisplayPanel timeline={PLACEHOLDER_TIMELINE} />
      </main>
    </ThemeProvider>
  );
}

export default App;
