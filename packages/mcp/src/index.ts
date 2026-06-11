#!/usr/bin/env node
// The Clock & Compass MCP server — stdio entry point.
//
// Usage (e.g. in an MCP client config):
//   DATABASE_URL=file:/path/to/clock-compass.db clock-compass-mcp
//
// A thin adapter over @clock-compass/core; see server.ts.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildMcpServer } from "./server.js";

const server = buildMcpServer();
await server.connect(new StdioServerTransport());
