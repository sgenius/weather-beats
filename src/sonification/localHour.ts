// The local hour-of-day (0-24, fractional) at a sample's location, and a
// smooth day/night curve derived from it (PLAN.md §4.5: "night -> minor/slow,
// day -> major/brighter"). `timeZone` undefined defaults to the runtime's own
// zone, matching WeatherTimeline.timeZone's convention.
export function getLocalHour(epochMs: number, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone,
  }).formatToParts(new Date(epochMs));

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return (hour % 24) + minute / 60;
}

/** 1 at solar noon, 0 at midnight, smoothly in between. */
export function dayness(localHour: number): number {
  return (Math.cos(((localHour - 12) / 12) * Math.PI) + 1) / 2;
}
