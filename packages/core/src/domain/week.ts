/**
 * ISO-week helpers. Weeks start on Monday (matching the weekly "big rocks first"
 * planning view). All times are normalized to local midnight.
 */
export function startOfIsoWeek(reference: Date = new Date()): Date {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = Sunday ... 6 = Saturday. Shift so Monday is the start.
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function isSameIsoWeek(a: Date, b: Date): boolean {
  return startOfIsoWeek(a).getTime() === startOfIsoWeek(b).getTime();
}
