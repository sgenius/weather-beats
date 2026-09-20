import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import * as geocoding from './location/geocoding';

describe('App', () => {
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

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
