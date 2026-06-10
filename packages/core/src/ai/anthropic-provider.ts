import Anthropic from "@anthropic-ai/sdk";
import type { ProactivityTag } from "@prisma/client";
import type {
  AiProvider,
  TaskClassification,
  WeeklyReviewContext,
} from "./provider.js";

const DEFAULT_MODEL = "claude-opus-4-8";

const CLASSIFY_SYSTEM = `You classify a single free-text todo sentence for a Covey-style planner.
Judge importance (does it serve a meaningful outcome, relationship, or responsibility?)
and urgency (does it genuinely demand attention soon?) separately — a due date alone
does not make something urgent. Tag proactivity: INFLUENCE when the user can act on it,
CONCERN when it is outside their control (worrying about the news, other people's
choices); null when the tag adds nothing. Extract a due date only when the sentence
implies one, resolving relative dates against the provided current date. Keep the title
short and imperative, dropping date/meta noise.`;

const CLASSIFY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "important", "urgent", "proactivity", "dueDate", "rationale"],
  properties: {
    title: { type: "string", description: "Cleaned-up imperative task title" },
    important: { type: "boolean" },
    urgent: { type: "boolean" },
    proactivity: { type: ["string", "null"], enum: ["INFLUENCE", "CONCERN", null] },
    dueDate: {
      type: ["string", "null"],
      description: "ISO date (YYYY-MM-DD) implied by the sentence, else null",
    },
    rationale: { type: "string", description: "One short sentence on the judgment" },
  },
} as const;

const PROACTIVITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["proactivity"],
  properties: {
    proactivity: { type: "string", enum: ["INFLUENCE", "CONCERN"] },
  },
} as const;

const MISSION_SYSTEM = `You refine personal mission statements (Covey's Habit 2 — begin
with the end in mind). Keep the author's voice, values, and imagery; tighten the prose;
prefer present tense and first person; aim for two to four sentences. Return ONLY the
refined statement — no preamble, no quotes, no commentary.`;

const REVIEW_SYSTEM = `You write the weekly review for a Covey-style planner ("put first
things first"). You receive a JSON snapshot of the user's week. Write 3-5 sentences in a
warm, candid coach's voice: name what landed, what slipped, and the single most
important thing to protect next week. Mention relationships before chores. Plain prose,
no lists, no headers, no emoji.`;

/** Server-side Anthropic implementation. Key comes from the environment, never code. */
export class AnthropicAiProvider implements AiProvider {
  readonly available = true;
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(options: { apiKey: string; model?: string }) {
    this.client = new Anthropic({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_MODEL;
  }

  /** One structured-output call; the JSON schema guarantees a parseable reply. */
  private async structured<T>(
    system: string,
    user: string,
    schema: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema } },
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("AI returned no text content");
    }
    return JSON.parse(block.text) as T;
  }

  private async prose(system: string, user: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("AI returned no text content");
    }
    return block.text.trim();
  }

  classifyTask(text: string, today: string): Promise<TaskClassification> {
    return this.structured<TaskClassification>(
      CLASSIFY_SYSTEM,
      `Current date: ${today}\n\nTask sentence: ${text}`,
      CLASSIFY_SCHEMA,
    );
  }

  async tagProactivity(
    title: string,
    notes?: string | null,
  ): Promise<ProactivityTag> {
    const result = await this.structured<{ proactivity: ProactivityTag }>(
      CLASSIFY_SYSTEM,
      `Tag this task as INFLUENCE or CONCERN.\nTitle: ${title}${notes ? `\nNotes: ${notes}` : ""}`,
      PROACTIVITY_SCHEMA,
    );
    return result.proactivity;
  }

  refineMission(draft: string): Promise<string> {
    return this.prose(MISSION_SYSTEM, draft);
  }

  weeklyReview(context: WeeklyReviewContext): Promise<string> {
    return this.prose(REVIEW_SYSTEM, JSON.stringify(context, null, 2));
  }
}
