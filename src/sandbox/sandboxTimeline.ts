// Pure sandbox-input logic, kept separate from the form component so it's
// unit-testable without rendering (and so the component file only exports
// the component, per react-refresh/only-export-components).
import type {
  Precipitation,
  PrecipitationType,
  WeatherTimeline,
} from '../contracts';

export interface SandboxNowValues {
  temperatureC: number;
  humidityPercent: number;
  cloudCoverPercent: number;
  precipitationType: PrecipitationType;
  precipitationAmountMm: number;
  timeOfDay: string;
}

export const DEFAULT_SANDBOX_VALUES: SandboxNowValues = {
  temperatureC: 18,
  humidityPercent: 55,
  cloudCoverPercent: 20,
  precipitationType: 'none',
  precipitationAmountMm: 0,
  timeOfDay: '08:00',
};

/**
 * Builds the single-sample WeatherTimeline the sandbox form describes.
 * epochMs uses the browser's "today" at the chosen time of day - a
 * stand-in for the active location's local time until the location
 * service (Stage 1 step 3) supplies a real one.
 */
export function sandboxValuesToTimeline(
  values: SandboxNowValues,
): WeatherTimeline {
  const [hours, minutes] = values.timeOfDay.split(':').map(Number);
  const now = new Date();
  const sample = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
  );

  const precipitation: Precipitation = {
    type: values.precipitationType,
    amountMm:
      values.precipitationType === 'none' ? 0 : values.precipitationAmountMm,
  };

  return {
    localTimeIso: sample.toISOString(),
    samples: [
      {
        epochMs: sample.getTime(),
        temperatureC: values.temperatureC,
        humidityPercent: values.humidityPercent,
        cloudCoverPercent: values.cloudCoverPercent,
        precipitation,
      },
    ],
  };
}
