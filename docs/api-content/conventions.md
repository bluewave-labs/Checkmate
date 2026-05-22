---
title: Conventions
description: Response envelope, request format, identifiers, pagination, and team scoping.
---

# Conventions

A small number of conventions apply to every endpoint. Once you've internalized them, the per-resource reference is mostly self-explanatory.

## Request format

- **Content-Type**: `application/json` for all POST/PUT/PATCH bodies, except multipart uploads (logos, profile images), which use `multipart/form-data`.
- **Charset**: UTF-8.
- **Method semantics**:
  - `GET` — read, never mutates state.
  - `POST` — create, or action that doesn't fit GET/PATCH/DELETE.
  - `PATCH` — partial update.
  - `PUT` — full replace.
  - `DELETE` — delete.

## Response envelope

Every JSON response uses the same shape:

```json
{
  "success": true,
  "msg": "OK",
  "data": { /* endpoint-specific payload */ }
}
```

| Field | Type | Meaning |
|---|---|---|
| `success` | boolean | `true` on 2xx, `false` on 4xx/5xx |
| `msg` | string | Human-readable summary — safe to surface in UIs |
| `data` | object \| array \| null | Endpoint-specific payload. Absent or `null` for `204 No Content`. |

Error responses use the same envelope with `success: false` and `data` typically omitted. See [Errors](/api/errors).

## Identifiers

- All resource IDs are **MongoDB ObjectIds** (24-character hex strings):
  ```
  65f1c2a4d8b9e0123456789a
  ```
- Treat IDs as opaque strings. Do not attempt to parse the timestamp or counter components.

## Team scoping

Most resources belong to a **team**. After login, the user record contains a `teamId`; pass it as a path parameter wherever the endpoint name includes `/team/...`:

```
GET /monitors/team/65f1c2a4d8b9e01234567890
GET /incidents/team
GET /checks/team
```

Users only see resources belonging to their own team, except for `superadmin`, who can read across teams.

## Date and time

- All timestamps in JSON are **ISO 8601** strings in UTC:
  ```
  "createdAt": "2026-04-01T10:00:00.000Z"
  ```
- Durations are typically integers in **milliseconds** (intervals, response times, time windows).

## Pagination

Endpoints that return collections accept these optional query parameters:

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `limit` | integer | endpoint-dependent | Maximum rows to return. |
| `page` | integer | `0` | Zero-indexed page number. |
| `sortBy` | string | endpoint-dependent | Field to sort by. |
| `sortOrder` | `asc` \| `desc` | `desc` | Sort direction. |
| `filter` | string | — | Endpoint-specific filter (e.g. status). |

When a collection supports pagination, the response `data` includes the rows plus the total count:

```json
{
  "success": true,
  "msg": "OK",
  "data": {
    "monitors": [ /* … */ ],
    "filteredMonitors": [ /* … */ ],
    "summary": { /* counters */ }
  }
}
```

Exact shapes vary per endpoint. See the [API reference](/api/reference) for each endpoint's response schema.

## File uploads

Two endpoints accept files:

- Status page logo: `POST /status-page` (multipart, field `logo`)
- User profile picture: `POST /auth/register`, `PATCH /auth/user/:id` (multipart, field `profileImage`)

Use `multipart/form-data` and include the JSON fields as separate form parts.

## CORS

The server's CORS policy is configured via the `CLIENT_HOST` environment variable. Only requests whose `Origin` matches `CLIENT_HOST` are accepted, and credentials (cookies) are allowed.

If you're calling the API from a browser on a different origin, the operator must add that origin to `CLIENT_HOST`. Server-to-server calls (curl, your backend) are not subject to CORS.

## Versioning

The base path includes the API version:

```
/api/v1/...
```

Within `v1`, additive changes (new endpoints, new optional fields) ship without notice. Breaking changes (removed endpoints, changed field types) only ship under a new major version.

Next: [Errors](/api/errors).
