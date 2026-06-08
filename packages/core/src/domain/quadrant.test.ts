import { describe, expect, it } from "vitest";
import { deriveQuadrant, isBigRockQuadrant } from "./quadrant.js";

describe("deriveQuadrant", () => {
  it("maps important + urgent to Q1", () => {
    expect(deriveQuadrant({ important: true, urgent: true })).toBe("Q1");
  });

  it("maps important + not urgent to Q2 (big rocks)", () => {
    expect(deriveQuadrant({ important: true, urgent: false })).toBe("Q2");
  });

  it("maps not important + urgent to Q3", () => {
    expect(deriveQuadrant({ important: false, urgent: true })).toBe("Q3");
  });

  it("maps neither to Q4", () => {
    expect(deriveQuadrant({ important: false, urgent: false })).toBe("Q4");
  });
});

describe("isBigRockQuadrant", () => {
  it("is true only for Q2", () => {
    expect(isBigRockQuadrant({ important: true, urgent: false })).toBe(true);
    expect(isBigRockQuadrant({ important: true, urgent: true })).toBe(false);
    expect(isBigRockQuadrant({ important: false, urgent: false })).toBe(false);
  });
});
