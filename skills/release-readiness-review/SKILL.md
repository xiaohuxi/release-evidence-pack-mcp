---
name: release-readiness-review
description: Produce an evidence-backed release go/no-go decision from Git changes and machine-readable test reports. Use when preparing a release, reviewing deployment readiness, checking whether change evidence is complete, assessing DDL or API/configuration risk, creating a rollback checklist, or deciding whether a build may proceed to deployment.
---

# Release Readiness Review

Use `release-evidence-pack-mcp` as the evidence source. Keep the review read-only and separate verified evidence from human assumptions.

## Workflow

1. Confirm the repository root, Git base revision, intended release scope, and available JUnit XML reports.
2. Call `inspect_release_changes` to identify changed code, database migrations, contracts, configuration, deployment files, and tests.
3. Call `summarize_test_reports` for every supplied report. Do not treat console text or an unverified statement such as “tests passed” as machine-readable evidence.
4. Call `build_release_evidence_pack` with the same base revision and report list.
5. Review every MCP finding and classify unresolved items:
   - **Blocker**: failed tests, destructive DDL without an approved rollback/forward-fix, exposed secret material, or an artifact that cannot be reproduced.
   - **Approval required**: source, API, configuration, deployment, or schema changes with incomplete evidence.
   - **Advisory**: low-risk documentation or metadata changes with adequate validation.
6. Add evidence the MCP cannot infer: CI URL, artifact identifier and digest, change ticket, owners, deployment window, monitoring signals, and rollback authority.
7. Produce the report using [references/review-template.md](references/review-template.md).
8. End with exactly one decision: `GO`, `CONDITIONAL GO`, or `NO-GO`.

## Decision Rules

- Return `NO-GO` when any blocker remains unresolved.
- Return `CONDITIONAL GO` only when every condition has an owner, deadline, and objective verification step.
- Return `GO` only when required tests pass, the deployable artifact is identifiable, migration risk is covered, and rollback steps are actionable.
- Never lower a risk level merely because a deployment is urgent.
- Never invent CI results, artifact digests, approvals, or rollback commands.

## Evidence Boundaries

- Cite file paths, report names, revisions, and finding codes from the MCP output.
- Mark information supplied only by a person as `declared`, not `verified`.
- Mark unavailable information as `missing`; do not infer success from absence.
- Keep testcase logs, secrets, tokens, credentials, and private configuration values out of the report.
- Do not modify the repository, run deployment commands, approve a change ticket, or trigger CI unless the user separately requests it.

## MCP Integration

Require the companion `release-evidence-pack-mcp` server. The source and installation instructions are available at <https://github.com/xiaohuxi/release-evidence-pack-mcp>.

Configure the server with the narrowest repository root that covers the review:

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

Use only these read-only tools: `inspect_release_changes`, `summarize_test_reports`, and `build_release_evidence_pack`.

## Examples

Example requests that should trigger this skill:

- “Review this branch before the production release and give me a go/no-go decision.”
- “Check whether the test, DDL, artifact, and rollback evidence is complete.”
- “Build a release evidence pack from `origin/main` and the Surefire reports.”
- “Explain why this release is blocked and list the evidence required to unblock it.”

Example MCP call:

```json
{
  "repositoryRoot": "/workspace/order-service",
  "baseRef": "origin/main",
  "reportFiles": ["target/surefire-reports/TEST-order.xml"]
}
```

## Error Handling

- If the repository is outside `RELEASE_EVIDENCE_ALLOWED_ROOTS`, stop and request a narrower valid root; never broaden access automatically.
- If `baseRef` is invalid or starts with `-`, stop and request a Git revision such as `HEAD`, a commit SHA, or `origin/main`.
- If a report file is missing, escapes the repository root, or is malformed, mark that evidence as missing and do not claim the tests passed.
- If Git is unavailable or the directory is not a repository, report the exact prerequisite and stop the review.
- If MCP output and declared human evidence conflict, preserve both, mark the conflict, and use the verified MCP evidence for the decision.

## Limits and Non-Trigger Conditions

- Do not use this skill to execute a deployment, modify CI, approve a ticket, or roll back production.
- Do not use it as a replacement for runtime monitoring, penetration testing, compliance approval, or a database backup.
- Do not infer remote CI status, artifact digests, or environment health from a local working tree.
- Do not use it for a general code review when no release-readiness decision is requested.
- Support Git working-tree evidence and JUnit XML in version 1.0.0; mark other report formats as unsupported instead of guessing.

## Completion Criteria

Declare the review complete only when:

- The Git base revision and release scope are explicit.
- Every changed high-risk surface has matching validation evidence or a named blocker.
- Test failures, missing evidence, and destructive migrations are visible in the decision.
- The deployable artifact and rollback target are identified or marked missing.
- The final decision is traceable to evidence and contains no fabricated facts.
