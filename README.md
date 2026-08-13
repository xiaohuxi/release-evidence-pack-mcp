# Resilience Path Map MCP

A read-only MCP server for reviewing retry, timeout, circuit-breaker, fallback, idempotency, and message-redelivery behavior as one end-to-end failure path.

## Tools

- `inventory_resilience_controls`: inventories resilience controls from caller-supplied source and configuration excerpts.
- `detect_retry_amplification`: detects multiplicative retries, timeout inversion, non-idempotent retries, MQ/business retry overlap, and failure-masking fallbacks.
- `render_failure_path`: renders the reviewed path as Mermaid.

The server does not scan the filesystem, call services, mutate configuration, or replay messages.

## Run

```bash
npm install
npm test
npm start
```

MCP configuration example:

```json
{
  "mcpServers": {
    "resilience-path-map": {
      "command": "npx",
      "args": ["-y", "resilience-path-map-mcp"]
    }
  }
}
```

The companion `retry-timeout-review` Skill is under `skills/`.

## License

MIT
