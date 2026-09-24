import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as geocoding from './location/geocoding';
import * as openMeteo from './weather/openMeteo';
import { clearWeatherCache } from './weather/weatherCache';

const fakeForecast: openMeteo.OpenMeteoResponse = {
  timezone: 'UTC',
  timezone_abbreviation: 'UTC',
  utc_offset_seconds: 0,
  current: { time: '2026-09-24T09:00' },
  hourly: {
    time: ['2026-09-24T09:00'],
    temperature_2m: [3],
    relative_humidity_2m: [61],
    cloud_cover: [45],
    precipitation: [0],
    snowfall: [0],
  },
  daily: { temperature_2m_max: [5], temperature_2m_min: [1] },
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    clearWeatherCache();
    vi.spyOn(openMeteo, 'fetchForecast').mockResolvedValue(fakeForecast);
  });

  it('renders the app heading', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: 'Weather Beats' }),
    ).toBeInTheDocument();
  });

  it('updates the display panel when the sandbox input changes', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '30' },
    });
    // Sandbox input is always Celsius; the panel shows the default unit (°F).
    expect(screen.getByText('86°F')).toBeInTheDocument();
  });

  it('converts the displayed temperature when the unit toggle changes', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '30' },
    });
    expect(screen.getByText('86°F')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('°C'));

    expect(screen.getByText('30°C')).toBeInTheDocument();
  });

  it('re-themes the page to match the classified weather state as sandbox input changes', () => {
    render(<App />);
    expect(document.documentElement.dataset.state).toBe('fair');

    fireEvent.change(screen.getByLabelText('Precipitation'), {
      target: { value: 'rain' },
    });
    expect(document.documentElement.dataset.state).toBe('rainy');

    fireEvent.change(screen.getByLabelText('Precipitation'), {
      target: { value: 'none' },
    });
    fireEvent.change(screen.getByLabelText('Temperature (°C)'), {
      target: { value: '5' },
    });
    expect(document.documentElement.dataset.state).toBe('too-cold');
  });

  it('falls back to Oakland when geolocation is unavailable, as in this test environment', () => {
    render(<App />);
    expect(
      screen.getByText(/Oakland, California \(fallback\)/),
    ).toBeInTheDocument();
  });

  it('updates the active location when a search resolves', async () => {
    vi.spyOn(geocoding, 'searchPlaces').mockResolvedValue([
      { name: 'Paris', latitude: 48.85, longitude: 2.35, country: 'France' },
    ]);
    render(<App />);

    fireEvent.change(screen.getByLabelText('Search for a place'), {
      target: { value: 'Paris' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText(/Paris, France/)).toBeInTheDocument();
  });

  it('shows live weather for the active location once it loads', async () => {
    render(<App />);
    expect(screen.getByText('Loading weather…')).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: 'Live weather' }),
    ).toBeInTheDocument();
    expect(screen.getByText('37°F')).toBeInTheDocument(); // 3°C -> 37.4°F
  });

  it('shows an error message when the live weather request fails', async () => {
    vi.spyOn(openMeteo, 'fetchForecast').mockRejectedValue(
      new Error('Weather request failed: 500'),
    );
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Weather request failed: 500',
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
