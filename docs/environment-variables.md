# Environment Variables

This document describes the environment variables used by Checkmate server.

Copy `server/.env.example` to `server/.env` and fill in your values.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_CONNECTION_STRING` | MongoDB connection string | `mongodb://localhost:27017/uptime_db` |
| `JWT_SECRET` | Secret key for JWT tokens | `my_secret` |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `LOG_LEVEL` | Logging level | `debug` |
| `TOKEN_TTL` | JWT token expiry time | `99d` |
| `CLIENT_HOST` | Frontend URL | `http://localhost:5173` |
| `ORIGIN` | Allowed CORS origin | `localhost` |

## Notes

- The server reads these variables from `server/.env`
- `JWT_SECRET` should be a strong, unique value in production
- `TOKEN_TTL` accepts any format valid for `ms` (e.g., `1h`, `7d`, `99d`)
