---
name: retry-timeout-review
description: Review Spring Cloud, Feign, Resilience4j, Spring Retry, and message-consumer call paths for retry amplification, timeout inversion, missing idempotency, conflicting circuit-breaker/fallback behavior, and overlapping MQ redelivery. Use when reviewing microservice resilience configuration, incident paths, or pull requests that change retries, timeouts, fallbacks, or consumers.
---

# Retry Timeout Review

Review an end-to-end failure path instead of judging each retry or timeout in isolation. Prefer observed source/config evidence and mark missing facts explicitly.

## Workflow

1. Define one business operation and its synchronous and asynchronous boundaries. Do not combine unrelated entry points.
2. Collect only relevant source/config excerpts with file paths. Never request secrets or invoke production endpoints.
3. Use `inventory_resilience_controls` to inventory Feign timeouts, Resilience4j/Spring Retry policies, circuit breakers, fallbacks, and MQ redelivery controls.
4. Build ordered path nodes and edges. Treat `attempts` as total executions, including the first call. Use `unknown` when a value is not evidenced; never silently assume one attempt.
5. Use `detect_retry_amplification` to find multiplicative retries, timeout inversion, retry without idempotency, MQ/business retry overlap, and success-shaped fallback masking.
6. Use `render_failure_path` to produce a Mermaid failure-path map. Annotate unknown controls and asynchronous boundaries.
7. Verify idempotency with concrete evidence: idempotency key, unique constraint, processed-message table, or guarded state transition. An annotation or method name alone is not proof.
8. Produce one verdict: `SAFE`, `CONDITIONAL`, or `UNSAFE`, with prioritized remediation and verification steps.

## Review Rules

- Compute worst-case amplification as the product of evidenced attempt counts along a path.
- Compare an upstream timeout with the downstream timeout multiplied by downstream attempts and backoff where known.
- Distinguish transport retry, business retry, broker redelivery, and manual replay.
- Flag a fallback returning normal success data when it hides exhaustion, circuit-open, or partial failure.
- Preserve `observed`, `declared`, and `missing` as separate evidence levels.
- Recommend consolidating retry ownership at one layer before merely lowering counts.
- Require idempotency before retrying writes, payments, inventory changes, notifications, or consumer side effects.

## Output

Follow [references/review-template.md](references/review-template.md). Every finding must name the affected path segment, supporting evidence, failure consequence, and smallest safe remediation. Do not claim runtime behavior from static evidence alone.

## Safety

This is a read-only review. Do not mutate configuration, inject failures, replay messages, call production services, or present guessed values as facts.
