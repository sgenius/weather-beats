import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import type { PlaybackMode, WeatherTimeline } from '../contracts';
import { buildScorePlan } from '../sonification/buildScorePlan';
import { DEFAULT_MAPPING } from '../sonification/defaultMapping';
import { WhatYoureHearingPanel } from './WhatYoureHearingPanel';

const timeline: WeatherTimeline = {
  timeZone: 'UTC',
  samples: Array.from({ length: 13 }, (_, i) => ({
    epochMs: Date.parse('2026-09-24T12:00:00Z') + i * 3_600_000,
    temperatureC: 10 + i,
    humidityPercent: 50,
    cloudCoverPercent: 20,
    precipitation:
      i >= 6
        ? { amountMm: 2, type: 'rain' as const }
        : { amountMm: 0, type: 'none' as const },
  })),
};

function renderPanel(mode: PlaybackMode, positionSeconds: number) {
  const plan = buildScorePlan(timeline, DEFAULT_MAPPING, mode);
  return render(
    <WhatYoureHearingPanel
      plan={plan}
      timeline={timeline}
      unit="celsius"
      positionSeconds={positionSeconds}
    />,
  );
}

describe('WhatYoureHearingPanel', () => {
  it('shows the forecast hour playing at the current position', () => {
    renderPanel('next12h', 7.4);
    expect(screen.getByText(/^\+7h/)).toHaveTextContent(
      /17°C.*precipitation rain, 2\.0 mm/,
    );
    expect(screen.getByText('7.4s of 13s')).toBeInTheDocument();
  });

  it('describes every track at that position', () => {
    renderPanel('next12h', 0);
    for (const track of ['Percussion', 'Background', 'Foreground']) {
      expect(screen.getByText(track)).toBeInTheDocument();
    }
    expect(screen.getByText(/major chord/)).toBeInTheDocument();
  });

  it('stays on "Now" across the whole "now" piece and flags the fade', () => {
    renderPanel('now', 6.5);
    expect(screen.getByText(/^Now/)).toHaveTextContent('10°C');
    expect(screen.getByText(/fading out/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '7');
  });

  it('announces only the weather line', () => {
    renderPanel('next12h', 3);
    expect(screen.getByText(/^\+3h/)).toHaveAttribute('aria-live', 'polite');
  });

  it('has no axe violations', async () => {
    const { container } = renderPanel('next12h', 3);
    expect(await axe(container)).toHaveNoViolations();
  });
});
