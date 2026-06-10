import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenAiCompatibleProvider } from "./openai-compatible-provider.js";

function completionResponse(content: string) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("OpenAiCompatibleProvider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const provider = new OpenAiCompatibleProvider({
    baseUrl: "http://localhost:11434/v1/", // trailing slash on purpose
    model: "llama3.2",
  });

  it("calls /chat/completions with json_object mode and parses the classification", async () => {
    fetchMock.mockResolvedValueOnce(
      completionResponse(
        JSON.stringify({
          title: "Call mom",
          important: true,
          urgent: false,
          proactivity: "INFLUENCE",
          dueDate: "2026-06-13",
          rationale: "Relationships are Q2.",
        }),
      ),
    );

    const result = await provider.classifyTask("call mom this weekend", "2026-06-10");
    expect(result).toMatchObject({
      title: "Call mom",
      important: true,
      urgent: false,
      proactivity: "INFLUENCE",
      dueDate: "2026-06-13",
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("llama3.2");
    expect(body.response_format).toEqual({ type: "json_object" });
    // No Authorization header when no key is configured (local runtimes).
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
  });

  it("falls back to safe values when the model strays from the shape", async () => {
    fetchMock.mockResolvedValueOnce(
      completionResponse(JSON.stringify({ important: "yes", dueDate: "soon" })),
    );
    const result = await provider.classifyTask("water the plants", "2026-06-10");
    expect(result).toMatchObject({
      title: "water the plants",
      important: false,
      urgent: false,
      proactivity: null,
      dueDate: null,
    });
  });

  it("sends a bearer token when a key is configured and surfaces HTTP errors", async () => {
    const keyed = new OpenAiCompatibleProvider({
      baseUrl: "https://api.openai.com/v1",
      apiKey: "sk-test",
      model: "gpt-test",
    });
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
    await expect(keyed.refineMission("draft")).rejects.toThrow(/401/);
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer sk-test",
    });
  });

  it("returns prose jobs without response_format", async () => {
    fetchMock.mockResolvedValueOnce(completionResponse("A refined mission."));
    const refined = await provider.refineMission("my draft");
    expect(refined).toBe("A refined mission.");
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.response_format).toBeUndefined();
  });
});
