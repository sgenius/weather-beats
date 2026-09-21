import { describe, expect, it } from 'vitest';
import type { OpenMeteoResponse } from './openMeteo';
import { normalizeOpenMeteoResponse } from './normalizeWeather';

/** 24 hourly entries for "today" (2026-09-21) plus 24 for "tomorrow". */
function buildResponse(
  overrides: Partial<OpenMeteoResponse> = {},
): OpenMeteoResponse {
  const hours = Array.from({ length: 48 }, (_, i) => i);
  const time = hours.map(
    (h) =>
      `2026-09-${h < 24 ? '21' : '22'}T${String(h % 24).padStart(2, '0')}:00`,
  );

  return {
    current: { time: '2026-09-21T14:32' },
    hourly: {
      time,
      temperature_2m: hours.map((h) => h),
      relative_humidity_2m: hours.map((h) => 100 - h),
      cloud_cover: hours.map(() => 50),
      precipitation: hours.map(() => 0),
      snowfall: hours.map(() => 0),
    },
    daily: {
      temperature_2m_max: [24],
      temperature_2m_min: [12],
    },
    ...overrides,
  };
}

describe('normalizeOpenMeteoResponse', () => {
  it('uses the current time verbatim as localTimeIso', () => {
    const timeline = normalizeOpenMeteoResponse(buildResponse());
    expect(timeline.localTimeIso).toBe('2026-09-21T14:32');
  });

  it('starts samples at the current hour and takes the next 12 hours (13 total)', () => {
    const timeline = normalizeOpenMeteoResponse(buildResponse());
    expect(timeline.samples).toHaveLength(13);
    expect(timeline.samples[0].temperatureC).toBe(14); // hour 14's fixture value
    expect(timeline.samples[12].temperatureC).toBe(26); // hour 14 + 12
  });

  it('classifies snow by snowfall, never by temperature, ahead of rain', () => {
    const response = buildResponse();
    response.hourly.precipitation[14] = 2;
    response.hourly.snowfall[14] = 1;
    response.hourly.temperature_2m[14] = 25; // warm - would be "rain" if type went by temperature

    const timeline = normalizeOpenMeteoResponse(response);
    expect(timeline.samples[0].precipitation).toEqual({
      amountMm: 2,
      type: 'snow',
    });
  });

  it('classifies precipitation with no snowfall as rain', () => {
    const response = buildResponse();
    response.hourly.precipitation[14] = 3;

    const timeline = normalizeOpenMeteoResponse(response);
    expect(timeline.samples[0].precipitation).toEqual({
      amountMm: 3,
      type: 'rain',
    });
  });

  it("takes today's temperature range from the daily block", () => {
    const timeline = normalizeOpenMeteoResponse(buildResponse());
    expect(timeline.todayTemperatureRangeC).toEqual({ min: 12, max: 24 });
  });

  it("computes today's humidity range only from today's hourly entries", () => {
    const timeline = normalizeOpenMeteoResponse(buildResponse());
    // Today is hours 0-23; humidity = 100 - hour, so today's range is 77-100.
    // (Hour 24 onward is tomorrow and must not leak into this range.)
    expect(timeline.todayHumidityRangePercent).toEqual({ min: 77, max: 100 });
  });
});
