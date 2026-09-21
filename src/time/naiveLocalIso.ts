// A "naive" local ISO-like string ("YYYY-MM-DDTHH:mm") - wall-clock time
// with no UTC offset. WeatherTimeline.localTimeIso uses this format from
// both sources: the sandbox (the browser's own local time) and the weather
// service (the queried location's local time, straight from Open-Meteo's
// timezone=auto response). Because it's never re-interpreted through a
// timezone, formatting it is pure string parsing - no Date object, so a
// browser in one timezone displays a searched location's time correctly
// even when that location is in a different timezone.
export function toNaiveLocalIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function formatNaiveLocalTime(iso: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(iso);
  if (!match) return iso;

  const hour24 = Number(match[1]);
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${match[2]} ${period}`;
}
