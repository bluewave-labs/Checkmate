---
title: Introduction
description: Use the Checkmate REST API to manage monitors, incidents, status pages, notifications, and users programmatically.
---

# Checkmate API

Checkmate exposes a REST API that mirrors everything the web UI can do. Use it to provision monitors from infrastructure-as-code, build internal dashboards, automate incident workflows, or integrate Checkmate into your existing alerting stack.

The web UI you log in to is itself just a client of this same API.

## Base URL

```
https://<your-checkmate-host>/api/v1
```

Replace `<your-checkmate-host>` with the domain where you deployed Checkmate. For local development:

```
http://localhost:52345/api/v1
```

All endpoints are relative to this base. Every path on this page is shown without the `/api/v1` prefix — prepend it when making requests.

## API stability

The API is at version **`v1`** and is considered stable. Breaking changes will only ship under a new major version (`/api/v2`).

## What you can do

| Resource | What it covers |
|---|---|
| `monitors` | Create, update, pause, and delete monitors of any type (HTTP, Ping, Port, DNS, Docker, PageSpeed, gRPC, WebSocket, Game, Hardware) |
| `checks` | Read individual check results and aggregated stats |
| `incidents` | List, filter, and resolve downtime incidents |
| `notifications` | Manage notification channels (email, Slack, Discord, webhooks) |
| `status-page` | Configure public status pages |
| `maintenance-window` | Schedule maintenance windows so checks don't fire incidents |
| `geo-checks` | Multi-region check results |
| `auth` | Register, log in, manage users |
| `invite` | Invite teammates |
| `logs` | Audit and operational logs |
| `settings` | Tune global Checkmate settings |
| `queue` | Inspect the background-job queue (operational) |
| `diagnostic` | Health and system info |

## What you'll need

1. A running Checkmate instance you administer.
2. A user account on that instance.
3. A JWT obtained by calling `POST /auth/login` — see [Authentication](/api/authentication).

There is no separate "API key" concept in Checkmate. The same JWT that authenticates the web UI authenticates every API call.

## Response shape

Every endpoint returns the same envelope:

```json
{
  "success": true,
  "msg": "OK",
  "data": { /* endpoint-specific payload */ }
}
```

See [Conventions](/api/conventions) for the full contract and [Errors](/api/errors) for failure shapes.

## Quick example

```bash
# 1. Log in to get a token
TOKEN=$(curl -s -X POST https://your-checkmate-host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPass1!"}' \
  | jq -r '.data.token')

# 2. List your team's monitors
curl https://your-checkmate-host/api/v1/monitors/team/<teamId> \
  -H "Authorization: Bearer $TOKEN"
```

Next: [Authentication](/api/authentication).
