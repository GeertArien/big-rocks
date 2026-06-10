#!/usr/bin/env node
// BigRocks MCP server — stdio entry point.
//
// Usage (e.g. in an MCP client config):
//   DATABASE_URL=file:/path/to/bigrocks.db big-rocks-mcp
//
// A thin adapter over @big-rocks/core; see server.ts.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildMcpServer } from "./server.js";

const server = buildMcpServer();
await server.connect(new StdioServerTransport());
