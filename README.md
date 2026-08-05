# Tool Contract Replay MCP

A local MCP server that snapshots MCP tool contracts, classifies compatibility changes, and safely replays deterministic fixtures against explicitly read-only tools.

## Why

An MCP server can still start after an upgrade while agents silently lose compatibility because a tool was renamed, a required argument was added, an output shape changed, or safety annotations drifted. This server turns those protocol-visible changes into repeatable evidence.

## Tools

### `snapshot_mcp_contract`

Connect to an operator-allowlisted stdio MCP target and return a deterministic snapshot of tool names, descriptions, input/output schemas, annotations, and execution metadata.

### `diff_mcp_contract`

Compare two snapshots and classify tool removal, required-input additions, schema drift, annotation downgrade, and compatible tool additions.

### `replay_contract_fixtures`

Replay up to 100 deterministic fixtures against a configured target. A fixture is executed only when the target declares the tool with `readOnlyHint: true`. Results expose structural observations only: error state, content types, and top-level structured-content keys.

## Install

```bash
npm install
npm run build
```

Node.js 20 or later is required.

## Configure

Targets are supplied once by the operator. MCP callers select only a `targetId`; they cannot pass arbitrary executable commands.

```json
{
  "mcpServers": {
    "tool-contract-replay": {
      "command": "node",
      "args": ["/absolute/path/tool-contract-replay-mcp/dist/index.js"],
      "env": {
        "TOOL_CONTRACT_REPLAY_TARGETS": "{\"baseline\":{\"command\":\"node\",\"args\":[\"/servers/v1/index.js\"]},\"candidate\":{\"command\":\"node\",\"args\":[\"/servers/v2/index.js\"]}}"
      }
    }
  }
}
```

## Example Workflow

```text
1. snapshot_mcp_contract({ "targetId": "baseline" })
2. snapshot_mcp_contract({ "targetId": "candidate" })
3. diff_mcp_contract({ "before": <baseline>, "after": <candidate> })
4. replay_contract_fixtures({
     "targetId": "candidate",
     "fixtures": [{
       "name": "inspect-demo",
       "tool": "inspect",
       "arguments": { "project": "demo" },
       "expect": {
         "isError": false,
         "contentTypes": ["text"],
         "structuredKeys": ["findings", "summary"]
       }
     }]
   })
```

## Safety Model

- Local stdio transport only.
- Operator-controlled target allowlist parsed at startup.
- No arbitrary command supplied through MCP tool arguments.
- Replay blocked unless the target declares `readOnlyHint: true`.
- No repository, baseline, fixture, or response persistence.
- Secret-shaped keys are redacted; replay reports structural observations instead of raw responses.
- Child processes receive Node's restricted default environment plus explicitly configured target variables.

Tool annotations are evidence, not proof. Review target code and use synthetic fixtures before trusting an unfamiliar MCP server.

## Paired Skill

`skills/mcp-contract-regression-review` converts snapshots, diffs, and fixture results into a `COMPATIBLE`, `CONDITIONAL`, or `BREAKING` decision with migration ownership and evidence limits.

## Development

```bash
npm run build
npm test
npm pack --dry-run
```

## License

MIT
