---
title: Quickstart
description: From zero to a working monitor in under five minutes.
---

# Quickstart

This walkthrough creates a Checkmate user, logs in, provisions an HTTP monitor, and reads its checks — all via the API.

It assumes you have a Checkmate instance running and reachable. Substitute `https://your-checkmate-host` with your actual host throughout.

## 1. Register the first user

If your instance is fresh, the first user becomes a superadmin:

```bash
curl -X POST https://your-checkmate-host/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "password": "Hunter2!Hunter2!",
    "role": ["superadmin"],
    "teamId": ""
  }'
```

The response includes a JWT and a freshly-created `teamId`. Save both.

If a superadmin already exists, skip to step 2 and use existing credentials.

## 2. Log in

If you already have an account:

```bash
TOKEN=$(curl -s -X POST https://your-checkmate-host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"Hunter2!Hunter2!"}' \
  | jq -r '.data.token')

TEAM_ID=$(curl -s -X POST https://your-checkmate-host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"Hunter2!Hunter2!"}' \
  | jq -r '.data.user.teamId')

echo "Token: $TOKEN"
echo "Team:  $TEAM_ID"
```

## 3. Create a monitor

This creates an HTTP monitor that probes example.com every 60 seconds:

```bash
curl -X POST https://your-checkmate-host/api/v1/monitors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"example.com\",
    \"type\": \"http\",
    \"url\": \"https://example.com\",
    \"interval\": 60000,
    \"teamId\": \"$TEAM_ID\",
    \"isActive\": true
  }"
```

A successful response returns the new monitor including its `_id`.

## 4. List your team's monitors

```bash
curl https://your-checkmate-host/api/v1/monitors/team/$TEAM_ID \
  -H "Authorization: Bearer $TOKEN"
```

You should see the monitor you just created. Within a minute, the background worker will have run a few checks against it.

## 5. Read recent checks

Replace `<MONITOR_ID>` with the `_id` from step 3:

```bash
curl "https://your-checkmate-host/api/v1/checks/<MONITOR_ID>?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

You'll see an array of check results — status code, response time, timestamp, region (if applicable).

## 6. Pause and delete the monitor

Pause:

```bash
curl -X PATCH https://your-checkmate-host/api/v1/monitors/<MONITOR_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

Delete:

```bash
curl -X DELETE https://your-checkmate-host/api/v1/monitors/<MONITOR_ID> \
  -H "Authorization: Bearer $TOKEN"
```

## What's next

- **Set up notifications** — `POST /notifications` to wire email / Slack / Discord / webhook channels, then attach them to monitors.
- **Build a status page** — `POST /status-page` to publish your monitors publicly.
- **Schedule maintenance** — `POST /maintenance-window` to silence checks during planned downtime.
- **Browse the full API reference** — see every endpoint with request/response schemas.

See the [reference](/api/reference) for the complete list of endpoints.
