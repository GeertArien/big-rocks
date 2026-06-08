import type { Quadrant } from "../domain/quadrant.js";

/**
 * The AI provider is kept behind this interface so the concrete implementation
 * (Anthropic today) is swappable and the rest of the app never imports a vendor
 * SDK directly. Implementations live alongside this file (e.g. anthropic.ts).
 *
 * The jobs themselves (quadrant classification, influence/concern tagging,
 * mission drafting, weekly review, NL intake) land in build-order step 7.
 */
export interface QuadrantClassification {
  quadrant: Quadrant;
  important: boolean;
  urgent: boolean;
  rationale?: string;
}

export interface AiProvider {
  /** Classify a free-text task into a quadrant (Habit 3 / NL intake). */
  classifyQuadrant(text: string): Promise<QuadrantClassification>;
}

/**
 * A no-op provider used when ANTHROPIC_API_KEY is unset. It keeps the app fully
 * functional without AI rather than throwing at startup.
 */
export class NoopAiProvider implements AiProvider {
  async classifyQuadrant(): Promise<QuadrantClassification> {
    throw new Error(
      "AI features are disabled: set ANTHROPIC_API_KEY to enable the Anthropic provider.",
    );
  }
}
