#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";
import { parseTargets } from "./targets.js";

const targets = parseTargets(process.env.TOOL_CONTRACT_REPLAY_TARGETS);
const server = createMcpServer(targets);
await server.connect(new StdioServerTransport());
