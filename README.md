# Release Evidence Pack MCP

A read-only Model Context Protocol server that converts local Git changes and JUnit XML reports into traceable release evidence, risk findings, and a rollback checklist.

## Why

Release decisions often rely on scattered screenshots, chat messages, CI logs, and assumptions. This server creates a reproducible evidence pack without deploying, modifying the repository, or uploading source code.

## Tools

### `inspect_release_changes`

Inspect a working-tree diff from a base revision and flag high-risk surfaces such as destructive SQL and source changes without test evidence.

### `summarize_test_reports`

Summarize JUnit XML totals while excluding testcase logs and captured output.

### `build_release_evidence_pack`

Combine Git changes and test summaries into structured JSON plus a Markdown decision pack with findings and rollback checks.

## Install

```bash
npm install
npm run build
```

Node.js 20 or later is required.

## Configure

Set `RELEASE_EVIDENCE_ALLOWED_ROOTS` to one or more repository roots. Separate paths with `;` on Windows or `:` on Linux/macOS. The current directory is the only allowed root when the variable is absent.

```json
{
  "mcpServers": {
    "release-evidence-pack": {
      "command": "node",
      "args": ["/absolute/path/release-evidence-pack-mcp/dist/index.js"],
      "env": {
        "RELEASE_EVIDENCE_ALLOWED_ROOTS": "/absolute/path/repositories"
      }
    }
  }
}
```

## Example

```text
build_release_evidence_pack({
  "repositoryRoot": "/workspace/service",
  "baseRef": "origin/main",
  "reportFiles": ["target/surefire-reports/TEST-api.xml"]
})
```

## Paired Skill

`skills/release-readiness-review` turns MCP findings into a strict `GO`, `CONDITIONAL GO`, or `NO-GO` decision with evidence inventory, release gates, owners, and rollback steps.

## Security Model

- Read-only Git and file inspection.
- No network calls or deployment actions.
- No shell interpolation; Git is invoked with an argument array.
- Repository access restricted to configured roots.
- Report paths cannot escape the repository root.
- Testcase logs and captured output are not returned.

## Development

```bash
npm test
npm run build
npm pack --dry-run
```

## License

MIT
