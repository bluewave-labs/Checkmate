---
title: Authentication
description: Obtain a JWT from /auth/login and send it as a Bearer token on every subsequent request.
---

# Authentication

Checkmate uses **JWT bearer tokens**. There are no API keys, no OAuth, and no client secrets. Every API user is a regular Checkmate user — the credentials you log in to the web UI with are the credentials you use to obtain a token.

## The flow

1. **Get a token** by calling `POST /auth/login` with your email and password.
2. **Send the token** as `Authorization: Bearer <token>` on every subsequent request.
3. **Refresh** by calling `POST /auth/login` again before the token expires.

## Obtaining a token

```bash
curl -X POST https://your-checkmate-host/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "YourPass1!"
  }'
```

A successful response returns the token plus the authenticated user record:

```json
{
  "success": true,
  "msg": "OK",
  "data": {
    "user": {
      "_id": "65f1c2a4d8b9e0123456789a",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "email": "you@example.com",
      "role": ["admin"],
      "teamId": "65f1c2a4d8b9e01234567890",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-15T14:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Store both `token` (for the `Authorization` header) and `user.teamId` (most resource endpoints are scoped by team).

## Using a token

Every authenticated request must include:

```
Authorization: Bearer <token>
```

```bash
curl https://your-checkmate-host/api/v1/monitors/team/<teamId> \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
const res = await fetch("https://your-checkmate-host/api/v1/monitors/team/<teamId>", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## Token lifetime

Tokens expire after the duration configured by the operator via the `TOKEN_TTL` environment variable. The default is **99 days**.

There is no separate refresh-token endpoint. When a token is close to expiry — or after a 401 response — call `POST /auth/login` again to obtain a new one.

## Roles

The `user.role` claim is an array. Available roles:

| Role | Capability |
|---|---|
| `superadmin` | Full access to all teams and global settings. Can promote other users. |
| `admin` | Full access within their team. |
| `user` | Read access within their team. |
| `demo` | Limited demo-mode access. |

A user can hold multiple roles simultaneously.

## Registering the first user

A fresh Checkmate instance has no users. The first call to `POST /auth/register` creates the first **superadmin** and provisions a team for them:

```bash
curl -X POST https://your-checkmate-host/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "password": "Hunter2!",
    "role": ["superadmin"],
    "teamId": ""
  }'
```

After the first user exists, additional users are usually created via the invite flow rather than `POST /auth/register`:

```
POST /invite/send         # superadmin/admin sends an invite
POST /auth/register       # invitee redeems the invite token
```

You can check whether a superadmin already exists with:

```bash
curl https://your-checkmate-host/api/v1/auth/users/superadmin
```

```json
{ "success": true, "data": true }
```

## Password recovery

The password-recovery flow is three calls, all unauthenticated:

```
POST /auth/recovery/request   # user requests a recovery email
POST /auth/recovery/validate  # client validates the recovery token
POST /auth/recovery/reset     # user sets a new password
```

## Logging out

JWTs are stateless — there is no server-side logout. Drop the token from your client storage. If you need to invalidate a token before its expiry (e.g. a compromised device), the operator must rotate the `JWT_SECRET` environment variable, which invalidates every outstanding token.

Next: [Conventions](/api/conventions).
