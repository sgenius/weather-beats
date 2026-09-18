import { useId } from 'react';
import type { PrecipitationType } from '../contracts';
import type { SandboxNowValues } from './sandboxTimeline';

interface SandboxNowFormProps {
  values: SandboxNowValues;
  onChange: (values: SandboxNowValues) => void;
}

/**
 * Minimal stand-in for live weather (PLAN.md §13 step 1b): describes the
 * current conditions by hand so the display panel - and later, the
 * soundscape - can be exercised before the location/weather services and
 * the full sandbox (step 9) exist.
 */
export function SandboxNowForm({ values, onChange }: SandboxNowFormProps) {
  const id = useId();

  function set<K extends keyof SandboxNowValues>(
    key: K,
    value: SandboxNowValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form aria-label="Sandbox weather input">
      <h2>Sandbox: describe the weather</h2>
      <p>
        Stands in for live weather (Stage 1 step 4) so the display panel can be
        built and checked before the weather service lands.
      </p>

      <label htmlFor={`${id}-temp`}>Temperature (°C)</label>
      <input
        id={`${id}-temp`}
        type="number"
        value={values.temperatureC}
        onChange={(e) => set('temperatureC', Number(e.target.value))}
      />

      <label htmlFor={`${id}-humidity`}>Humidity (%)</label>
      <input
        id={`${id}-humidity`}
        type="number"
        min={0}
        max={100}
        value={values.humidityPercent}
        onChange={(e) => set('humidityPercent', Number(e.target.value))}
      />

      <label htmlFor={`${id}-cloud`}>Cloud cover (%)</label>
      <input
        id={`${id}-cloud`}
        type="number"
        min={0}
        max={100}
        value={values.cloudCoverPercent}
        onChange={(e) => set('cloudCoverPercent', Number(e.target.value))}
      />

      <label htmlFor={`${id}-precip-type`}>Precipitation</label>
      <select
        id={`${id}-precip-type`}
        value={values.precipitationType}
        onChange={(e) =>
          set('precipitationType', e.target.value as PrecipitationType)
        }
      >
        <option value="none">None</option>
        <option value="rain">Rain</option>
        <option value="snow">Snow</option>
      </select>

      <label htmlFor={`${id}-precip-amount`}>Precipitation amount (mm)</label>
      <input
        id={`${id}-precip-amount`}
        type="number"
        min={0}
        disabled={values.precipitationType === 'none'}
        value={values.precipitationAmountMm}
        onChange={(e) => set('precipitationAmountMm', Number(e.target.value))}
      />

      <label htmlFor={`${id}-time`}>Time of day</label>
      <input
        id={`${id}-time`}
        type="time"
        value={values.timeOfDay}
        onChange={(e) => set('timeOfDay', e.target.value)}
      />
    </form>
  );
}
