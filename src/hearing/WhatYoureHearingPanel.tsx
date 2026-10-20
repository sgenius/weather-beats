import type { ScorePlan, WeatherTimeline } from '../contracts';
import {
  formatLocalTime,
  formatPercent,
  formatPrecipitation,
  formatTemperature,
} from '../display/formatWeather';
import type { TemperatureUnit } from '../units/temperatureUnit';
import { describePlanAt, sampleIndexAt } from './describePlanAt';
import { describeTrack } from './describeTrack';

interface WhatYoureHearingPanelProps {
  /** The plan actually playing - not one rebuilt from current inputs. */
  plan: ScorePlan;
  /** The timeline `plan` was built from. */
  timeline: WeatherTimeline;
  unit: TemperatureUnit;
  positionSeconds: number;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The audio's visual equivalent (PLAN.md §6): the weather sample being
 * played and every track's notes/levers, at the current playback position.
 * Only the weather line is a live region - it changes at most once per
 * forecast hour, while the track details update too often to announce.
 */
export function WhatYoureHearingPanel({
  plan,
  timeline,
  unit,
  positionSeconds,
}: WhatYoureHearingPanelProps) {
  const moment = describePlanAt(plan, positionSeconds);
  const index = sampleIndexAt(plan, moment.seconds, timeline.samples.length);
  const sample = timeline.samples[index];
  const totalSeconds = plan.durationSeconds + plan.fadeOutSeconds;
  const when = index === 0 ? 'Now' : `+${index}h`;

  return (
    <section aria-label="What you're hearing">
      <h2>What you&apos;re hearing</h2>
      <progress
        aria-label="Playback progress"
        max={totalSeconds}
        value={moment.seconds}
      />
      <p>
        {moment.seconds.toFixed(1)}s of {totalSeconds}s
        {moment.isFadingOut && ' (fading out)'}
      </p>
      <p aria-live="polite">
        {when} ({formatLocalTime(sample.epochMs, timeline.timeZone)}):{' '}
        {formatTemperature(sample.temperatureC, unit)},{' '}
        {formatPercent(sample.humidityPercent)} humidity,{' '}
        {formatPercent(sample.cloudCoverPercent)} cloud, precipitation{' '}
        {formatPrecipitation(sample.precipitation).toLowerCase()}
      </p>
      <dl>
        {moment.tracks.map((track) => (
          <div key={track.trackId}>
            <dt>{capitalize(track.trackId)}</dt>
            <dd>{describeTrack(track)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
