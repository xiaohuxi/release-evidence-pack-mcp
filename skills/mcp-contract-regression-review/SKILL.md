---
name: mcp-contract-regression-review
description: Review MCP server upgrades for tool-contract regressions using deterministic snapshots, schema and annotation diffs, and safe fixture replay. Use when upgrading or publishing an MCP server, changing tool names or input/output schemas, checking tool-calling compatibility, reviewing annotations such as readOnlyHint, investigating why an agent stopped calling a tool, or preparing an MCP migration decision. 触发场景包括 MCP 契约检查、工具 Schema 变更、MCP 升级兼容性、夹具回放和工具调用回归。
---

# MCP Contract Regression Review

Use `tool-contract-replay-mcp` as the evidence source. Review protocol-visible behavior only; do not claim full semantic equivalence from schemas or a finite fixture set.

## Workflow

1. Confirm the baseline and candidate MCP versions, their allowlisted `targetId` values, and the intended compatibility window.
2. Call `snapshot_mcp_contract` for both versions. Preserve the returned JSON as review evidence outside the MCP if persistence is required.
3. Call `diff_mcp_contract` with the two snapshots.
4. Review every reported change:
   - Treat a removed tool or newly required input as **breaking**.
   - Treat input/output schema changes and a `readOnlyHint` downgrade as **risky** until migration evidence exists.
   - Treat a new tool as **compatible** unless it changes routing or naming assumptions outside the contract.
5. Select deterministic fixtures for unchanged or intentionally migrated read-only tools. Include boundary and error fixtures where they are stable.
6. Call `replay_contract_fixtures` against the candidate target. The MCP blocks tools that are not explicitly marked `readOnlyHint: true`.
7. Reconcile schema findings with replay results. A passing fixture does not override a breaking schema change; it only proves that one declared example still works.
8. Produce the report with [references/review-template.md](references/review-template.md).
9. End with exactly one decision: `COMPATIBLE`, `CONDITIONAL`, or `BREAKING`.

## Fixture Rules

- Use minimal synthetic arguments; never place real tokens, passwords, cookies, customer data, or production identifiers in fixtures.
- Assert structural observations: `isError`, content block types, and top-level structured-content keys.
- Do not assert volatile timestamps, generated prose, ordering that the contract does not guarantee, or live external data.
- Keep one fixture focused on one compatibility promise.
- Never replay write, destructive, approval, deployment, payment, or production mutation tools.
- If a target lacks `readOnlyHint: true`, record replay as blocked rather than weakening the guardrail.

## Decision Rules

- Return `BREAKING` when a tool was removed without an agreed replacement, a required input was added without a compatibility path, or a critical fixture fails.
- Return `CONDITIONAL` when all breaking changes have explicit migrations but risky schema or replay evidence remains incomplete. Give every condition an owner and verification step.
- Return `COMPATIBLE` only when no unresolved breaking change remains and the representative fixture set passes.
- Never infer compatibility from an empty diff if one snapshot is missing, malformed, or taken from the wrong target.
- Never invent tool versions, fixture results, approvals, or migration ownership.

## Evidence Boundaries

- Cite target IDs, tool names, change codes, fixture names, and observed structures from MCP output.
- Mark facts supplied only by a person as `declared`; mark MCP output as `observed`.
- Mark missing baselines or fixtures as `missing`; do not convert absence into success.
- Exclude raw tool responses, secrets, credentials, and private payload values from the report.
- State explicitly that schema diffing plus finite fixture replay cannot prove all runtime behavior.

## MCP Integration

Require the companion `tool-contract-replay-mcp` server from <https://github.com/xiaohuxi/tool-contract-replay-mcp>.

Use only these tools:

- `snapshot_mcp_contract`
- `diff_mcp_contract`
- `replay_contract_fixtures`

The operator must configure targets in `TOOL_CONTRACT_REPLAY_TARGETS`; never ask the MCP caller to supply an arbitrary executable command.

## Error Handling

- If a target ID is unknown, request an operator-configured allowlist entry; do not broaden execution dynamically.
- If the target fails to start or negotiate MCP, preserve the exact prerequisite failure and mark the snapshot or replay as missing.
- If replay is blocked because a tool is not declared read-only, keep it blocked and require manual evidence.
- If baseline and candidate snapshots come from the same target version, stop and correct the evidence source.
- If snapshots and declared documentation conflict, preserve both and prioritize observed protocol output.

## Completion Criteria

Complete the review only when:

- Baseline and candidate targets are unambiguous.
- Every tool removal, addition, required-input change, schema change, and read-only downgrade is classified.
- Representative read-only fixtures passed or their absence is visible.
- Migration actions have owners where compatibility is conditional.
- The final decision is traceable to observed evidence and states the review limits.
