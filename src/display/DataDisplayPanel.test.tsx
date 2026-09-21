import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import type { WeatherTimeline } from '../contracts';
import { DataDisplayPanel } from './DataDisplayPanel';

const baseTimeline: WeatherTimeline = {
  localTimeIso: '2026-09-13T08:00',
  samples: [
    {
      epochMs: new Date(2026, 8, 13, 8, 0).getTime(),
      temperatureC: 18,
      humidityPercent: 55,
      cloudCoverPercent: 20,
      precipitation: { type: 'none', amountMm: 0 },
    },
  ],
};

describe('DataDisplayPanel', () => {
  it('renders the required current-conditions values in the given unit', () => {
    render(<DataDisplayPanel timeline={baseTimeline} unit="celsius" />);
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
    expect(screen.getByText('18°C')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByText(/temperature range/i)).not.toBeInTheDocument();
  });

  it('converts the temperature when the unit is fahrenheit', () => {
    render(<DataDisplayPanel timeline={baseTimeline} unit="fahrenheit" />);
    expect(screen.getByText('64°F')).toBeInTheDocument();
  });

  it('renders the today ranges, converted, when present', () => {
    render(
      <DataDisplayPanel
        timeline={{
          ...baseTimeline,
          todayTemperatureRangeC: { min: 12, max: 24 },
          todayHumidityRangePercent: { min: 40, max: 70 },
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('12–24°C')).toBeInTheDocument();
    expect(screen.getByText('40–70%')).toBeInTheDocument();
  });

  it('displays localTimeIso verbatim, independent of epochMs or the runtime timezone', () => {
    render(
      <DataDisplayPanel
        timeline={{
          ...baseTimeline,
          localTimeIso: '2026-09-13T23:30',
          samples: [{ ...baseTimeline.samples[0], epochMs: 0 }],
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('11:30 PM')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <DataDisplayPanel timeline={baseTimeline} unit="fahrenheit" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
