import { describe, expect, it } from "vitest";
import { deriveStatus, nextDueDate, periodHistory } from "./cadence.js";

const weekly = { unit: "WEEK", value: 1 } as const;

describe("periodHistory", () => {
  it("marks each cadence period hit/miss, oldest first", () => {
    const now = new Date("2026-02-01T00:00:00Z");
    const occurrences = [
      new Date("2026-01-30T00:00:00Z"), // current period (last 7 days)
      new Date("2026-01-10T00:00:00Z"), // 3 periods back
    ];
    expect(periodHistory(occurrences, weekly, 4, now)).toEqual([
      true, // Jan 4–11
      false, // Jan 11–18
      false, // Jan 18–25
      true, // Jan 25–Feb 1
    ]);
  });

  it("is all misses with no occurrences", () => {
    expect(periodHistory([], weekly, 3)).toEqual([false, false, false]);
  });
});

describe("nextDueDate", () => {
  it("adds the cadence interval to the last occurrence", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    expect(nextDueDate(last, { unit: "WEEK", value: 2 }).toISOString()).toBe(
      "2026-01-15T00:00:00.000Z",
    );
  });
});

describe("deriveStatus", () => {
  it("is OVERDUE when nothing has ever been logged", () => {
    expect(deriveStatus(null, weekly)).toBe("OVERDUE");
  });

  it("is ON_TRACK right after an occurrence", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-02T00:00:00Z");
    expect(deriveStatus(last, weekly, now)).toBe("ON_TRACK");
  });

  it("is DUE_SOON near the end of the interval", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-07T00:00:00Z"); // 1 day left of 7
    expect(deriveStatus(last, weekly, now)).toBe("DUE_SOON");
  });

  it("is OVERDUE once the interval has elapsed", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-09T00:00:00Z");
    expect(deriveStatus(last, weekly, now)).toBe("OVERDUE");
  });
});
