import type { WeatherTimeline } from '../contracts';
import type { TemperatureUnit } from '../units/temperatureUnit';
import {
  formatLocalTime,
  formatPercent,
  formatPercentRange,
  formatPrecipitation,
  formatTemperature,
  formatTemperatureRange,
} from './formatWeather';

interface DataDisplayPanelProps {
  timeline: WeatherTimeline;
  unit: TemperatureUnit;
}

/**
 * Renders the required current-conditions values (PLAN.md §1/§7) for the
 * first ("now") sample of a WeatherTimeline. Source-agnostic: it doesn't
 * know or care whether the timeline came from the sandbox or live weather.
 */
export function DataDisplayPanel({ timeline, unit }: DataDisplayPanelProps) {
  const [current] = timeline.samples;

  return (
    <section aria-label="Current weather">
      <h2>Current weather</h2>
      <dl>
        <dt>Local time</dt>
        <dd>{formatLocalTime(current.epochMs, timeline.timeZone)}</dd>

        <dt>Temperature</dt>
        <dd>{formatTemperature(current.temperatureC, unit)}</dd>

        {timeline.todayTemperatureRangeC && (
          <>
            <dt>Today&apos;s temperature range</dt>
            <dd>
              {formatTemperatureRange(timeline.todayTemperatureRangeC, unit)}
            </dd>
          </>
        )}

        <dt>Humidity</dt>
        <dd>{formatPercent(current.humidityPercent)}</dd>

        {timeline.todayHumidityRangePercent && (
          <>
            <dt>Today&apos;s humidity range</dt>
            <dd>{formatPercentRange(timeline.todayHumidityRangePercent)}</dd>
          </>
        )}

        <dt>Cloud cover</dt>
        <dd>{formatPercent(current.cloudCoverPercent)}</dd>

        <dt>Precipitation</dt>
        <dd>{formatPrecipitation(current.precipitation)}</dd>
      </dl>
    </section>
  );
}
