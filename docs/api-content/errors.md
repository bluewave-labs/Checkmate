---
title: Errors
description: HTTP status codes Checkmate returns, what they mean, and how to handle them.
---

# Errors

Failure responses share the same envelope as successful ones, with `success: false` and `data` omitted (or `null`):

```json
{
  "success": false,
  "msg": "Validation failed: email must be a valid email"
}
```

Always treat the **HTTP status code** as the source of truth for handling logic, and surface `msg` to humans.

## Status codes

| Status | Meaning | When you'll see it |
|---|---|---|
| `200 OK` | Request succeeded with a body | Most GETs, successful mutations that return the new resource |
| `204 No Content` | Request succeeded with no body | DELETEs, successful actions like `/status-page/:url/unlock` |
| `400 Bad Request` | Malformed request | Missing required path param, malformed JSON, invalid file upload |
| `401 Unauthorized` | Missing or invalid JWT | Token expired, token missing, token signed with a different secret |
| `403 Forbidden` | Authenticated, but not allowed | Accessing a resource that belongs to a different team, or insufficient role |
| `404 Not Found` | Resource doesn't exist | Wrong ID, deleted resource, mistyped path |
| `409 Conflict` | Operation would violate a constraint | Duplicate email on register, slug already taken on status page |
| `413 Payload Too Large` | File upload exceeded limit | Logo or profile image too big |
| `422 Unprocessable Entity` | Request was well-formed but failed validation | Zod / Joi schema rejected the body |
| `429 Too Many Requests` | Rate limit exceeded | See [Rate limiting](/api/rate-limiting) |
| `500 Internal Server Error` | Unexpected server error | A bug — report it with the request ID |

## Common shapes

### 401 — missing or invalid token

```json
{
  "success": false,
  "msg": "No auth token provided"
}
```

Re-authenticate by calling `POST /auth/login`.

### 422 — validation error

```json
{
  "success": false,
  "msg": "\"email\" must be a valid email"
}
```

The `msg` describes the first failing field. Re-send the request with the fix.

### 403 — forbidden

```json
{
  "success": false,
  "msg": "Forbidden"
}
```

You're authenticated but the resource isn't visible to you. Common cause: passing a `teamId` that isn't your team's.

### 429 — rate limited

```json
{
  "success": false,
  "msg": "Too many requests"
}
```

Inspect `RateLimit-*` response headers and back off. See [Rate limiting](/api/rate-limiting).

## Error handling pattern

Client code should branch on status code, not on `msg`:

```javascript
const res = await fetch(url, opts);
const body = await res.json().catch(() => ({}));

switch (res.status) {
  case 200:
  case 204:
    return body.data;

  case 401:
    // Token expired or missing — re-authenticate, then retry once.
    await reauthenticate();
    return retry();

  case 422:
    // Surface the validation error to the user.
    throw new ValidationError(body.msg);

  case 429:
    // Back off using Retry-After if present.
    const retryAfter = Number(res.headers.get("Retry-After") ?? 60);
    await sleep(retryAfter * 1000);
    return retry();

  default:
    throw new Error(`Checkmate API ${res.status}: ${body.msg ?? res.statusText}`);
}
```

## Reporting bugs

If you see a `500`, capture:

- The exact request (method, path, body — **redact secrets**)
- The full response body and headers
- A timestamp in UTC

Open an issue at https://github.com/bluewave-labs/Checkmate/issues with that information.

Next: [Rate limiting](/api/rate-limiting).
