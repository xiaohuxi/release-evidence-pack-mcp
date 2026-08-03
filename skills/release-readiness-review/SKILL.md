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

## Completion Criteria

Declare the review complete only when:

- The Git base revision and release scope are explicit.
- Every changed high-risk surface has matching validation evidence or a named blocker.
- Test failures, missing evidence, and destructive migrations are visible in the decision.
- The deployable artifact and rollback target are identified or marked missing.
- The final decision is traceable to evidence and contains no fabricated facts.
