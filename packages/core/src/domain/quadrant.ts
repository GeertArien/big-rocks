/**
 * The Covey time-management matrix. The quadrant is always DERIVED from a task's
 * `important` x `urgent` flags so it can never drift out of sync with them.
 *
 *   Q1  important + urgent       -> do now (crises)
 *   Q2  important + not urgent   -> the BIG ROCKS (plan these first)
 *   Q3  not important + urgent   -> delegate / minimize
 *   Q4  not important + not urgent -> eliminate
 */
export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

export interface ImportanceUrgency {
  important: boolean;
  urgent: boolean;
}

export function deriveQuadrant({ important, urgent }: ImportanceUrgency): Quadrant {
  if (important && urgent) return "Q1";
  if (important && !urgent) return "Q2";
  if (!important && urgent) return "Q3";
  return "Q4";
}

/** Q2 — important but not urgent — is the heart of the app. */
export function isBigRockQuadrant(iu: ImportanceUrgency): boolean {
  return deriveQuadrant(iu) === "Q2";
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: "Urgent & Important",
  Q2: "Important, Not Urgent (Big Rocks)",
  Q3: "Urgent, Not Important",
  Q4: "Not Urgent, Not Important",
};
