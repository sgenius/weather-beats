import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import App from './App';

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

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
