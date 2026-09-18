import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SANDBOX_VALUES,
  sandboxValuesToTimeline,
} from './sandboxTimeline';

describe('sandboxValuesToTimeline', () => {
  it('builds a single-sample timeline, zeroing amount when there is no precipitation', () => {
    const timeline = sandboxValuesToTimeline({
      ...DEFAULT_SANDBOX_VALUES,
      precipitationAmountMm: 12,
    });
    expect(timeline.samples).toHaveLength(1);
    expect(timeline.samples[0].temperatureC).toBe(18);
    expect(timeline.samples[0].precipitation.amountMm).toBe(0);
  });

  it('places the sample at the requested time of day, today', () => {
    const timeline = sandboxValuesToTimeline({
      ...DEFAULT_SANDBOX_VALUES,
      timeOfDay: '14:30',
    });
    const sampleDate = new Date(timeline.samples[0].epochMs);
    expect([sampleDate.getHours(), sampleDate.getMinutes()]).toEqual([14, 30]);
  });
});
