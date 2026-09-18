import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { LocationStatus } from './LocationStatus';

describe('LocationStatus', () => {
  it('announces the current label and coordinates', () => {
    render(
      <LocationStatus
        location={{
          status: 'fallback',
          coordinates: { latitude: 37.8044, longitude: -122.2711 },
          label: 'Oakland, California (fallback)',
        }}
      />,
    );
    expect(
      screen.getByText(/Oakland, California \(fallback\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/37\.80/)).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <LocationStatus
        location={{
          status: 'granted',
          coordinates: { latitude: 1, longitude: 2 },
          label: 'Your location',
        }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
