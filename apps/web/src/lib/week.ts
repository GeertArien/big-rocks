/** Monday of the current ISO week, as an ISO string (matches the server). */
export function startOfIsoWeekIso(reference: Date = new Date()): string {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  return d.toISOString();
}
