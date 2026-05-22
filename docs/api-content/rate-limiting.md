---
title: Rate limiting
description: Per-IP request limits, headers, and how to back off.
---

# Rate limiting

Checkmate applies two per-IP rate limiters, both with a **60-second window**:

| Limiter | Applies to | Limit |
|---|---|---|
| General | All requests under `/api/v1/*` | **600 requests / 60 seconds** |
| Auth-sensitive | `/auth/login`, `/auth/register`, `/auth/recovery/*`, `/status-page/:url/unlock` | **15 requests / 60 seconds** |

The two limiters are **independent**. Auth-sensitive endpoints count against both buckets — you can hammer `/auth/login` 15 times in a minute before being rate-limited there, but a single client can never exceed 600 total requests per minute regardless of which endpoints are called.

## Headers

Every response includes the standard `RateLimit-*` headers so you can pace yourself proactively:

```
RateLimit-Limit: 600
RateLimit-Remaining: 587
RateLimit-Reset: 42
```

| Header | Meaning |
|---|---|
| `RateLimit-Limit` | The cap for the current window. |
| `RateLimit-Remaining` | Requests left before you hit `429`. |
| `RateLimit-Reset` | Seconds until the window resets. |

## When you exceed the limit

You receive `HTTP 429 Too Many Requests`:

```json
{
  "success": false,
  "msg": "Too many requests"
}
```

The response also includes `Retry-After`:

```
Retry-After: 42
```

Wait that many seconds before retrying. If `Retry-After` is missing, fall back to the `RateLimit-Reset` header.

## Recommended backoff

For one-off scripts, simple sleep-then-retry is fine:

```javascript
async function callWithRetry(url, opts, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;
    const retry = Number(res.headers.get("Retry-After") ?? 60);
    await new Promise(r => setTimeout(r, retry * 1000));
  }
  throw new Error("Rate limit retry exhausted");
}
```

For higher-throughput integrations, watch `RateLimit-Remaining` and pace your sender to stay below the limit rather than waiting for `429`.

## Limits and proxies

Rate-limiting is per **client IP**, derived from the connection — or, when Checkmate is behind a reverse proxy with `trust proxy` configured, from the leftmost public IP in `X-Forwarded-For`.

If many of your clients share an egress IP (NAT, corporate proxy), they share the bucket. In that case, an operator should either:

- Increase the limits (server code change required), or
- Make sure each client connects from a distinct IP.

## Limits are not contractual

The numbers above reflect the current defaults. An operator can change them at any time (they're hardcoded in `server/src/middleware/rateLimiter.ts`). If you're building an integration that depends on a higher limit, coordinate with the operator first.

Next: [API reference](/api/reference) — auto-generated from the OpenAPI spec.
