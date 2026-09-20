// The °F default / °C toggle (PLAN.md §2), persisted to localStorage. Pure
// conversion + persistence, kept separate from the toggle UI and from the
// display formatting that consumes it.
export type TemperatureUnit = 'fahrenheit' | 'celsius';

const STORAGE_KEY = 'weather-beats:temperature-unit';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function loadTemperatureUnit(): TemperatureUnit {
  return localStorage.getItem(STORAGE_KEY) === 'celsius'
    ? 'celsius'
    : 'fahrenheit';
}

export function saveTemperatureUnit(unit: TemperatureUnit): void {
  localStorage.setItem(STORAGE_KEY, unit);
}
