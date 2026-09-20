import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTemperatureUnit } from './useTemperatureUnit';

beforeEach(() => {
  localStorage.clear();
});

describe('useTemperatureUnit', () => {
  it('defaults to fahrenheit and persists a change to localStorage', () => {
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current[0]).toBe('fahrenheit');

    act(() => result.current[1]('celsius'));

    expect(result.current[0]).toBe('celsius');
    expect(localStorage.getItem('weather-beats:temperature-unit')).toBe(
      'celsius',
    );
  });

  it('starts from a previously saved preference', () => {
    localStorage.setItem('weather-beats:temperature-unit', 'celsius');
    const { result } = renderHook(() => useTemperatureUnit());
    expect(result.current[0]).toBe('celsius');
  });
});
