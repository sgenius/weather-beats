import { useState } from 'react';
import {
  loadTemperatureUnit,
  saveTemperatureUnit,
  type TemperatureUnit,
} from './temperatureUnit';

/** The persisted °F/°C preference (PLAN.md §2), as `[unit, setUnit]`. */
export function useTemperatureUnit(): [
  TemperatureUnit,
  (unit: TemperatureUnit) => void,
] {
  const [unit, setUnit] = useState<TemperatureUnit>(loadTemperatureUnit);

  function changeUnit(next: TemperatureUnit) {
    setUnit(next);
    saveTemperatureUnit(next);
  }

  return [unit, changeUnit];
}
