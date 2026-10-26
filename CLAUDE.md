# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is an open-source uptime and infrastructure monitoring application. It monitors server hardware, uptime, response times, and incidents with real-time alerts. The companion agent [Capture](https://github.com/bluewave-labs/capture) provides infrastructure metrics (CPU, RAM, disk, temperature).

## Development Commands

### Client (React/Vite)
```bash
cd client
npm install
npm run dev -- --port 10001 --strictPort   # Local dev port is 10001 (5173 is used by another project on this machine)
npm run build            # TypeScript check + production build
npm run lint             # ESLint (strict, max-warnings 0)
npm run format           # Prettier formatting
npm run format-check     # Check formatting
```

Server `.env` on this machine is configured with `CLIENT_HOST="http://localhost:10001"` to match the client dev port. If you change the client port, keep `.env` in sync.

### Server (Node.js/Express)
```bash
cd server
npm install
npm run dev              # Start with hot-reload (nodemon + tsx) at http://localhost:52345
npm run build            # TypeScript compile + path alias resolution
npm run test             # Run Jest tests with coverage
npm run lint             # ESLint v9
npm run lint-fix         # Auto-fix lint issues
npm run format           # Prettier formatting
```

### Docker Development
```bash
docker build -f docker/Dockerfile -t checkmate .          # build the mono image (server + built client)
docker compose -f docker/dev/docker-compose.yaml up       # local full stack (builds image, runs mongo + worker)
docker run -d -p 27017:27017 -v uptime_mongo_data:/data/db --name uptime_database_mongo mongo:8.0   # just a dev database
```

## Environment Setup

### Server `.env` (minimum required)
```env
CLIENT_HOST="http://localhost:5173"
JWT_SECRET="my_secret_key_change_this"
DB_CONNECTION_STRING="mongodb://localhost:27017/uptime_db"
TOKEN_TTL="99d"
ORIGIN="localhost"
LOG_LEVEL="debug"
```

### Client `.env`
```env
VITE_APP_API_BASE_URL="http://localhost:52345/api/v1"
VITE_APP_LOG_LEVEL="debug"
```

## Architecture

### Monorepo Structure
- `/client` - React 18 + TypeScript + Vite + MUI frontend
- `/server` - Node.js 24+ + Express + TypeScript backend
- `/docker` - Multi-environment Docker configs (dev, staging, prod, arm, mono)

### Backend Layers
```
server/src/
├── api/             # HTTP layer
│   ├── controllers/   # Route handlers (authController, monitorController, etc.)
│   ├── middleware/    # verifyJWT, rateLimiter, sanitization, handleErrors
│   ├── routes/        # API route definitions
│   └── validation/    # Zod request-payload schemas
├── domain/          # Business logic + data access, one folder per entity
│   ├── monitors/      # e.g. monitor.service.ts, monitor.repository.ts, monitor.type.ts
│   ├── checks/
│   ├── incidents/
│   └── …              # users, teams, status-pages, notifications, etc.
├── service/         # Cross-cutting services (e.g. infrastructure/)
├── config/          # App config wiring (controllers, routes, services, envValidation)
├── db/
│   └── migration/   # Database migrations (run on startup)
├── templates/       # Email/notification templates
├── types/           # Shared const tuples + derived types
└── utils/           # Shared utilities
```

### Frontend Structure
```
client/src/
├── Components/      # Reusable UI components
├── Pages/           # Page components (Auth, Uptime, Infrastructure, Incidents, etc.)
├── Features/        # Redux slices (Auth, UI)
├── Hooks/           # Custom React hooks
├── Utils/           # Utilities (NetworkService.js is main API client)
├── Validation/      # Input validation
└── locales/         # i18n translations
```

### API
- Base URL: `/api/v1`
- Documentation: `http://localhost:52345/api-docs` (Swagger UI)
- OpenAPI spec: `/server/openapi.json`, generated at build time from the route tables
- Routes: one `RouteTable` per resource in `server/src/api/routes/*Routes.ts`. `buildRouter` builds the Express router from it and `server/openapi/registerRoutes.ts` builds the spec from it, so every endpoint is declared exactly once

### Key Technologies
- **State Management**: Redux Toolkit + Redux-Persist
- **Data Fetching**: SWR + Axios
- **Database**: MongoDB with Mongoose ODM
- **Queue**: custom MongoDB-backed job queue in `server/src/worker/` (no Redis, no BullMQ, no Pulse)
- **i18n**: i18next + react-i18next (non-English locales are machine translated, not managed through a translation service)

---

## Backend Architecture Patterns

### Repository Pattern & Separation of Concerns

The backend enforces a strict three-layer separation between HTTP handling, business logic, and data access:

```
Request → Controller → Service → Repository → MongoDB (Mongoose)
```

- **Controllers** (`/controllers`) handle HTTP concerns only. Each method is a plain `async` arrow that parses the request with a Zod schema, calls the appropriate service with the parse result, and writes `res.json({ success, msg, data })`. No wrapper is needed: Express 5 forwards rejected promises to `handleErrors`, which maps `ZodError` to 400 and `AppError` to its definition's status. They contain no business logic.
- **Services** (`/service/business`) contain all business logic: deciding whether an incident should be created, whether a notification should fire, what state a monitor is in, etc.
- **Repositories** (`/repositories`) are the sole layer that talks to MongoDB through Mongoose. They expose clean, reusable query methods (e.g. `findByMonitorId`, `createCheck`) so that services never construct raw DB queries directly.

This separation makes each layer independently testable and keeps Mongoose-specific code out of business logic. When adding a new feature, the pattern to follow is: add a repository method for any new DB query, call it from a service, and expose it via a controller route.

### Monitoring Flow: From Check to Notification

Background monitoring runs on a polled, MongoDB-backed job queue, not on the HTTP request
cycle. There is **no Redis, BullMQ or Pulse** anywhere in the server dependencies — the queue
is implemented in `server/src/worker/`. The high-level flow for uptime monitoring is:

```
JobScheduler (worker.job-scheduler.ts)   → seeds/claims due jobs in Mongo
  → DBQueueWorker (worker.db-queue.ts)   → claims a job under a lock lease
    → WorkerPipeline (worker.pipeline.ts)
        ├── produce(): performs the HTTP/port/ping/docker check
        ├── ingestChecks(): buffers + persists Check docs via the repository layer
        └── handleEvaluate() / evaluateCheck(): decides the monitor's state change
              ├── IncidentService  (create / resolve incident)
              └── NotificationService (email, Slack, Discord, webhook)
```

1. **`JobScheduler`** keeps a per-job-type polling loop. Each loop claims jobs that are due
   from the Mongo `jobs` collection, backing off on idle (`POLL_MS` 250 ms → `POLL_MAX_MS`
   5 s) and resetting on work or an explicit `wake()`.
2. **`DBQueueWorker`** claims a job by taking a **lock lease** (`LOCK_MS`), renewing it at
   1/3 the lease so an in-flight job survives two missed renewals. Concurrency is per job
   type (`CONCURRENCY`: `check` 500, `geo-check`/`evaluate` 20, cleanup/telemetry 1).
3. **`WorkerPipeline.produce()`** performs the actual check and `ingestChecks()` persists the
   results as `Check` documents through the repository layer.
4. A separate **`evaluate`** job compares the result against the monitor's previous state and
   delegates to `IncidentService` to open or resolve an `Incident`.
5. On a state change, `NotificationService` dispatches to the monitor's configured channels.

Job types are a const tuple in `server/src/domain/jobs/job.type.ts`:
`check`, `geo-check`, `evaluate`, `cleanup-orphaned`, `cleanup-retention`, `telemetry`.

### Queue System (MongoDB-backed)

MongoDB is the queue's only backing store. Workers coordinate through two collections — the
`jobs` collection (claim + lock lease) and `queue-workers` (liveness).

- Each job type has its own polling loop and concurrency cap, so a slow type does not block others.
- Scheduling interval is driven by the `interval` field on the `Monitor` model.
- Workers send **heartbeats** at `WORKER_STALE_MS / 3`, so a worker can miss two beats before
  being treated as stale and having its jobs reclaimed.
- Shutdown **drains** in-flight jobs (`DRAIN_TIMEOUT_MS` 25 s) rather than dropping them.
- `QueueMode` (see `domain/app-settings`) selects whether a process schedules, processes, or both.

When working on anything related to check scheduling, incident lifecycle, or notifications,
trace the flow starting from `server/src/worker/worker.job-scheduler.ts` and
`worker.pipeline.ts` rather than from the controller layer.

---

## Code Conventions

### Coding conventions (mandatory)
Read `docs/coding-conventions.md` before touching any `.tsx` or `.ts` file. The doc covers both frontend and backend rules, all enforced in code review.

**Universal — rule 0:** look at peer files first and follow the established pattern. Don't sneak in novel shapes.

**Frontend (`client/src`):**
1. Prefer MUI native props over `sx` (e.g. `color={…}`, `bgcolor={…}`, `mt={…}` — not `sx={{ color, bgcolor, mt }}`).
2. Use the full theme path for colors: `color={theme.palette.text.secondary}`, never `color="text.secondary"` (greppability).
3. No hardcoded literals — use `LAYOUT.*`, `typographyLevels.*`, `theme.shape.borderRadius`, `theme.palette.*`.
4. Use `useTheme()` inside components; don't `import { theme } from "@/Utils/Theme/Theme"`.
5. Pair runtime tuples with derived types: `const X = [...] as const; type X = (typeof X)[number]`.

**Backend (`server/src`):**
6. Layering: Controller → Service → Repository → Mongoose. No DB calls outside repositories.
7. Provider conventions: DI for stdlib clients, `SERVICE_NAME` + `TIMEOUT_MS` constants, `timeRequest()` helper, inline `setTimeout` race for timeout, outer try/catch into `AppError`.
8. Mongoose schema fields with closed value sets must declare `enum` reusing the same `types/*` const tuple.
9. Provider tests at `server/test/unit/providers/network/<name>.test.ts`, `from "@jest/globals"`, `testStatusProviderContract`, inline `setup()` per test (not `beforeEach`).
10. Centralize validation enums in `types/*` const tuples; never inline `z.enum([…])` more than once.
11. Entity shapes are one Zod schema in `domain/<entity>/<entity>.schema.ts`; the TS type is inferred from it and the auto-generated OpenAPI spec reads it. New fields go there and in the Mongoose model, nowhere else.
12. Every `AppError` is built from a definition: client errors from `domain/<entity>/<entity>.errors.ts`, server errors from `internalError`. Route tables list definitions by reference and the OpenAPI spec is generated from them; `npm run test:route-errors` checks both directions.

### Internationalization
All user-facing strings must use the translation function:
```javascript
t('your.key')  // Never hardcode UI strings
```

### Branching
- Always branch from `develop` (not master)
- Use descriptive names: `feat/add-alerts`, `fix/login-error`
- PRs target `develop` branch

### Formatting
- **Client**: Prettier with `printWidth: 90`, tabs, double quotes
- **Server**: Prettier with `printWidth: 150`, tabs, double quotes
- Both use ESLint with strict settings

### Testing
Server tests use Jest (with `--experimental-vm-modules` for ESM):
```bash
npm test                              # Run all tests with coverage
npm test -- -t "pattern"              # Run tests matching name pattern
npm test -- path/to/file.test.ts      # Run a specific file
```
Test files: `server/test/**/*.test.ts`

## Database Models

Key Mongoose models in `/server/src/db/models/`:
- **Monitor** - Monitoring configuration (website, infrastructure, port, etc.)
- **Check** - Individual monitoring check results
- **Incident** - Downtime incidents
- **User** - User accounts
- **Team** - Team/workspace management
- **StatusPage** - Public status pages
- **Notification** - Alert configuration (email, Discord, Slack, webhooks)
- **MaintenanceWindow** - Scheduled maintenance periods
- **AppSettings** - Global application settings