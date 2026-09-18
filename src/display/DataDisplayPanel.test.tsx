import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import type { WeatherTimeline } from '../contracts';
import { DataDisplayPanel } from './DataDisplayPanel';

const baseTimeline: WeatherTimeline = {
  localTimeIso: new Date(2026, 8, 13, 8, 0).toISOString(),
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
  it('renders the required current-conditions values', () => {
    render(<DataDisplayPanel timeline={baseTimeline} />);
    expect(screen.getByText('18°C')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByText(/temperature range/i)).not.toBeInTheDocument();
  });

  it('renders the today ranges when present', () => {
    render(
      <DataDisplayPanel
        timeline={{
          ...baseTimeline,
          todayTemperatureRangeC: { min: 12, max: 24 },
          todayHumidityRangePercent: { min: 40, max: 70 },
        }}
      />,
    );
    expect(screen.getByText('12–24°C')).toBeInTheDocument();
    expect(screen.getByText('40–70%')).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<DataDisplayPanel timeline={baseTimeline} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
