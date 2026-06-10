import { startOfIsoWeek } from "./week.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Marks falling inside the ISO week that starts at `weekStart`. */
function countInWeek(marks: Date[], weekStart: Date): number {
  const start = weekStart.getTime();
  const end = start + WEEK_MS;
  return marks.filter((d) => {
    const t = d.getTime();
    return t >= start && t < end;
  }).length;
}

/**
 * Week-streak (the locked-in streak model): consecutive ISO weeks the target
 * was met, counting back from the current week. The in-progress current week
 * NEVER breaks a streak — it simply doesn't count until the target is met.
 */
export function weekStreak(
  marks: Date[],
  targetPerWeek: number,
  now: Date = new Date(),
  maxWeeks = 104,
): number {
  const target = Math.max(1, targetPerWeek);
  let streak = 0;
  for (let i = 0; i < maxWeeks; i++) {
    const weekStart = startOfIsoWeek(new Date(now.getTime() - i * WEEK_MS));
    const met = countInWeek(marks, weekStart) >= target;
    if (i === 0) {
      // Current week: extend if already met, otherwise skip without breaking.
      if (met) streak++;
      continue;
    }
    if (met) streak++;
    else break;
  }
  return streak;
}

/** Marks in the ISO week containing `now`. */
export function countThisWeek(marks: Date[], now: Date = new Date()): number {
  return countInWeek(marks, startOfIsoWeek(now));
}
