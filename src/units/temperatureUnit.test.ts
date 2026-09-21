import { beforeEach, describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  loadTemperatureUnit,
  saveTemperatureUnit,
} from './temperatureUnit';

beforeEach(() => {
  localStorage.clear();
});

describe('celsiusToFahrenheit', () => {
  it('converts freezing and boiling points', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
  });
});

describe('temperature unit persistence', () => {
  it('defaults to fahrenheit when nothing is stored', () => {
    expect(loadTemperatureUnit()).toBe('fahrenheit');
  });

  it('round-trips a saved preference', () => {
    saveTemperatureUnit('celsius');
    expect(loadTemperatureUnit()).toBe('celsius');
  });

  it('falls back to fahrenheit for any unrecognised stored value', () => {
    localStorage.setItem('weather-beats:temperature-unit', 'kelvin');
    expect(loadTemperatureUnit()).toBe('fahrenheit');
  });
});
