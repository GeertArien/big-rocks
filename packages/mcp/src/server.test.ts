import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildMcpServer } from "./server.js";

/**
 * Wire the server to a real MCP client over an in-memory transport and list
 * tools — verifies the adapter registers the full agent-facing surface
 * without touching the database.
 */
describe("big-rocks MCP server", () => {
  it("exposes the core service surface as tools", async () => {
    const server = buildMcpServer();
    const client = new Client({ name: "test", version: "0.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);

    for (const expected of [
      "list_tasks",
      "create_task",
      "update_task",
      "complete_task",
      "quadrant_matrix",
      "big_rocks_this_week",
      "get_mission",
      "list_roles",
      "list_goals",
      "list_projects",
      "people_overview",
      "overdue_commitments",
      "log_commitment_occurrence",
      "add_eba_entry",
      "list_habits",
      "toggle_habit",
      "renewal_summary",
      "renewal_trends",
      "log_renewal_activity",
      "weekly_intentions",
    ]) {
      expect(names).toContain(expected);
    }

    await client.close();
    await server.close();
  });
});
