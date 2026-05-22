---
title: API reference overview
description: All endpoints, grouped by resource. Auto-generated from the OpenAPI spec.
---

# API reference

The full machine-readable specification is at [`server/openapi.json`](https://github.com/bluewave-labs/Checkmate/blob/develop/server/openapi.json). Mintlify renders an interactive reference from it — each endpoint below is fully documented with request/response schemas, examples, and a built-in "Try it" form.

## Endpoint groups

| Group | Description |
|---|---|
| **auth** | Register, log in, password recovery, manage users |
| **invite** | Send and redeem team invites |
| **monitors** | Create, update, pause, and delete monitors |
| **checks** | Read individual check results and team-wide summaries |
| **incidents** | List, filter, and resolve downtime incidents |
| **maintenance-window** | Schedule maintenance windows to silence checks |
| **notifications** | Configure email, Slack, Discord, and webhook channels |
| **status-page** | Manage public status pages |
| **geo-checks** | Multi-region check results |
| **logs** | Audit and operational logs |
| **settings** | Global Checkmate settings |
| **queue** | Background-job queue health (operational) |
| **diagnostic** | System health and version info |

## Authentication

Every endpoint except the unauthenticated auth/recovery routes requires:

```
Authorization: Bearer <jwt>
```

See [Authentication](/api/authentication) for how to obtain a token.

## Conventions recap

- Base URL: `https://your-checkmate-host/api/v1`
- Response envelope: `{ success, msg, data }`
- IDs: 24-character MongoDB ObjectIds
- Timestamps: ISO 8601 UTC
- Durations: integers in milliseconds
- Most resources are team-scoped — pass `teamId` where the path includes `/team/...`

See [Conventions](/api/conventions) for full details.
