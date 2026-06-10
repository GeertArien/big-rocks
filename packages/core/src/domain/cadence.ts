import type { CadenceUnit } from "@prisma/client";

/**
 * Shared cadence/recurrence logic. Used by recurring commitments (Habits 4-6)
 * and, later, by recurring tasks — modeled once here rather than duplicated.
 */
export interface Cadence {
  unit: CadenceUnit;
  value: number; // every `value` `unit`s, e.g. { WEEK, 2 } = every two weeks.
}

export type CommitmentStatus = "ON_TRACK" | "DUE_SOON" | "OVERDUE";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function unitInDays(unit: CadenceUnit): number {
  switch (unit) {
    case "DAY":
      return 1;
    case "WEEK":
      return 7;
    case "MONTH":
      return 30; // approximation; good enough for nudges
  }
}

/** When the next occurrence is due, given the last time it happened. */
export function nextDueDate(lastOccurred: Date, cadence: Cadence): Date {
  const days = unitInDays(cadence.unit) * Math.max(1, cadence.value);
  return new Date(lastOccurred.getTime() + days * MS_PER_DAY);
}

/** The cadence interval in milliseconds. */
export function intervalMs(cadence: Cadence): number {
  return unitInDays(cadence.unit) * Math.max(1, cadence.value) * MS_PER_DAY;
}

/**
 * Hit/miss history for the last `periods` cadence intervals, oldest first —
 * the streak/history view (chosen over pass/fail-per-period rows). A period
 * is "hit" when at least one occurrence falls inside it.
 */
export function periodHistory(
  occurrences: Date[],
  cadence: Cadence,
  periods = 8,
  now: Date = new Date(),
): boolean[] {
  const interval = intervalMs(cadence);
  const times = occurrences.map((d) => d.getTime());
  const history: boolean[] = [];
  for (let i = periods - 1; i >= 0; i--) {
    const end = now.getTime() - i * interval;
    const start = end - interval;
    history.push(times.some((t) => t > start && t <= end));
  }
  return history;
}

/**
 * Derive an on-track / due-soon / overdue status from the cadence and the most
 * recent occurrence. "Due soon" is the final 20% of the interval.
 */
export function deriveStatus(
  lastOccurred: Date | null,
  cadence: Cadence,
  now: Date = new Date(),
): CommitmentStatus {
  if (!lastOccurred) return "OVERDUE";
  const due = nextDueDate(lastOccurred, cadence).getTime();
  if (now.getTime() >= due) return "OVERDUE";
  const intervalMs =
    unitInDays(cadence.unit) * Math.max(1, cadence.value) * MS_PER_DAY;
  const remaining = due - now.getTime();
  return remaining <= intervalMs * 0.2 ? "DUE_SOON" : "ON_TRACK";
}
