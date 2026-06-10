/**
 * Shared prompts for the AI jobs — identical across providers so swapping the
 * backend (Anthropic, ChatGPT, a local model) never changes the judgments.
 */

export const CLASSIFY_SYSTEM = `You classify a single free-text todo sentence for a Covey-style planner.
Judge importance (does it serve a meaningful outcome, relationship, or responsibility?)
and urgency (does it genuinely demand attention soon?) separately — a due date alone
does not make something urgent. Tag proactivity: INFLUENCE when the user can act on it,
CONCERN when it is outside their control (worrying about the news, other people's
choices); null when the tag adds nothing. Extract a due date only when the sentence
implies one, resolving relative dates against the provided current date. Keep the title
short and imperative, dropping date/meta noise.`;

/** Appended for providers without JSON-schema enforcement (json_object mode). */
export const CLASSIFY_JSON_SHAPE = `Respond with ONLY a JSON object of this exact shape:
{"title": string, "important": boolean, "urgent": boolean,
 "proactivity": "INFLUENCE" | "CONCERN" | null,
 "dueDate": "YYYY-MM-DD" | null, "rationale": string}`;

export const PROACTIVITY_JSON_SHAPE = `Respond with ONLY a JSON object of this exact shape:
{"proactivity": "INFLUENCE" | "CONCERN"}`;

export const MISSION_SYSTEM = `You refine personal mission statements (Covey's Habit 2 — begin
with the end in mind). Keep the author's voice, values, and imagery; tighten the prose;
prefer present tense and first person; aim for two to four sentences. Return ONLY the
refined statement — no preamble, no quotes, no commentary.`;

export const REVIEW_SYSTEM = `You write the weekly review for a Covey-style planner ("put first
things first"). You receive a JSON snapshot of the user's week. Write 3-5 sentences in a
warm, candid coach's voice: name what landed, what slipped, and the single most
important thing to protect next week. Mention relationships before chores. Plain prose,
no lists, no headers, no emoji.`;
