const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longDateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

export const clock = (d = new Date()) => timeFmt.format(d).replace(/\s?[AP]M$/i, '');
export const clockFull = (d = new Date()) => timeFmt.format(d);
export const longDate = (d = new Date()) => longDateFmt.format(d);

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "Today 2:14 AM", "Yesterday 9:31 PM", "Tuesday", "Oct 12" — like a real phone. */
export function relativeStamp(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return `Today ${timeFmt.format(ts)}`;
  if (days === 1) return `Yesterday ${timeFmt.format(ts)}`;
  if (days < 7) return `${dayFmt.format(ts)} ${timeFmt.format(ts)}`;
  return `${dateFmt.format(ts)} ${timeFmt.format(ts)}`;
}

export function shortStamp(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return timeFmt.format(ts);
  if (days === 1) return 'Yesterday';
  if (days < 7) return dayFmt.format(ts);
  return dateFmt.format(ts);
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
