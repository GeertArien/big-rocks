import { describe, expect, it } from "vitest";
import { countThisWeek, weekStreak } from "./habit.js";

// 2026-06-10 is a Wednesday; its ISO week is Mon Jun 8 – Sun Jun 14.
const now = new Date("2026-06-10T12:00:00");

function days(...isoDates: string[]): Date[] {
  return isoDates.map((d) => new Date(`${d}T00:00:00`));
}

describe("weekStreak", () => {
  it("counts consecutive past weeks that met the target", () => {
    // Target 2/week; two full past weeks met, week before that missed.
    const marks = days(
      "2026-06-01", "2026-06-03", // last week: 2 ✓
      "2026-05-25", "2026-05-28", // week before: 2 ✓
      "2026-05-18", //              three back: 1 ✗
    );
    expect(weekStreak(marks, 2, now)).toBe(2);
  });

  it("never breaks the streak on an unfinished current week", () => {
    const marks = days("2026-06-01", "2026-06-03"); // last week met, this week 0
    expect(weekStreak(marks, 2, now)).toBe(1);
  });

  it("extends the streak once the current week's target is met", () => {
    const marks = days(
      "2026-06-08", "2026-06-10", // this week: 2 ✓
      "2026-06-01", "2026-06-03", // last week: 2 ✓
    );
    expect(weekStreak(marks, 2, now)).toBe(2);
  });

  it("is zero when no past week ever met the target", () => {
    expect(weekStreak(days("2026-06-09"), 3, now)).toBe(0);
  });
});

describe("countThisWeek", () => {
  it("counts only marks inside the current ISO week", () => {
    const marks = days("2026-06-08", "2026-06-10", "2026-06-07"); // Sun 7th = last week
    expect(countThisWeek(marks, now)).toBe(2);
  });
});
