import type { TemperatureUnit } from './temperatureUnit';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

export function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <fieldset>
      <legend>Temperature unit</legend>
      <label>
        <input
          type="radio"
          name="temperature-unit"
          value="fahrenheit"
          checked={unit === 'fahrenheit'}
          onChange={() => onChange('fahrenheit')}
        />
        °F
      </label>
      <label>
        <input
          type="radio"
          name="temperature-unit"
          value="celsius"
          checked={unit === 'celsius'}
          onChange={() => onChange('celsius')}
        />
        °C
      </label>
    </fieldset>
  );
}
