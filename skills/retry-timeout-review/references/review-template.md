# Review Template

## Scope

- Business operation:
- Entry point:
- Synchronous boundary:
- Asynchronous boundary:
- Evidence reviewed:

## Failure Path

Include the Mermaid map and list each node's timeout, attempts, backoff, circuit breaker, fallback, and idempotency evidence. Mark unknowns.

## Findings

For each finding provide:

- Severity and rule
- Affected segment
- Evidence (`observed`, `declared`, or `missing`)
- Worst-case consequence
- Smallest safe remediation
- Verification method

## Verdict

Choose exactly one:

- `SAFE`: no material conflict found in the evidenced path.
- `CONDITIONAL`: safety depends on named missing evidence or deployment settings.
- `UNSAFE`: an evidenced combination can amplify, duplicate, mask, or prematurely terminate work.

End with the three highest-priority actions and state static-analysis limitations.
