# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is an open-source uptime and infrastructure monitoring application. It monitors server hardware, uptime, response times, and incidents with real-time alerts. The companion agent [Capture](https://github.com/bluewave-labs/capture) provides infrastructure metrics (CPU, RAM, disk, temperature).

## Development Commands

### Client (React/Vite)
```bash
cd client
npm install
npm run dev              # Vite dev server (default http://localhost:5173)
npm run build            # TypeScript check + production build
npm run lint             # ESLint
npm run format           # Prettier formatting
npm run format-check     # Check formatting
```

The server's `CLIENT_HOST` must match the origin the client is served from (CORS). If you run the client on another port, update `.env` to match. Machine-specific overrides belong in an uncommitted `CLAUDE.local.md`.

### Server (Node.js/Express)
```bash
cd server
npm install
npm run dev              # Start with hot-reload (nodemon + tsx) at http://localhost:52345
npm run build            # TypeScript compile + path alias resolution
npm run test             # Run Jest tests with coverage
npm run test:route-errors # Check route tables and error definitions agree
npm run lint             # ESLint v9
npm run lint-fix         # Auto-fix lint issues
npm run format           # Prettier formatting
```

### Docker Development
```bash
docker build -f docker/Dockerfile -t checkmate .          # build the all-in-one image (server + built client)
docker compose -f docker/dev/docker-compose.yaml up       # local full stack (builds image, runs app + worker + mongo)
docker run -d -p 27017:27017 -v uptime_mongo_data:/data/db --name uptime_database_mongo mongo:8.0   # just a dev database
```

## Environment Setup

### Server `.env` (minimum required)
```env
CLIENT_HOST="http://localhost:5173"
JWT_SECRET="my_secret_key_change_this"
DB_CONNECTION_STRING="mongodb://localhost:27017/uptime_db"
TOKEN_TTL="99d"
LOG_LEVEL="debug"
```

The full list of server variables, with defaults, is validated in `server/src/config/envValidation.ts` and documented in the README's Configuration table.

### Client `.env` (dev only; in production the server injects runtime config, see `CLIENT_CONFIG_*`)
```env
VITE_APP_API_BASE_URL="http://localhost:52345/api/v1"
VITE_APP_LOG_LEVEL="debug"
```

## Architecture

### Monorepo Structure
- `/client` - React 18 + TypeScript + Vite + MUI frontend
- `/server` - Node.js 24+ + Express + TypeScript backend
- `/docker` - `Dockerfile` (all-in-one image), the reference `docker-compose.yaml`, and `dev/` (local stack, custom CA example)
- `/charts/helm` - Helm chart (still on the legacy split images, pinned at v3.8.1)
- `/docs` - Contributor docs (coding conventions, custom CA, translations of the README)

### Backend Layers
```
server/src/
├── api/             # HTTP layer
│   ├── controllers/   # Route handlers (authController, monitorController, etc.)
│   ├── middleware/    # verifyJWT, isAllowed, rateLimiter, sanitization, handleErrors
│   ├── routes/        # One RouteTable per resource
│   └── validation/    # Zod request-payload schemas
├── domain/          # Business logic + data access, one folder per entity
│   ├── monitors/      # monitor.service.ts, monitor.repository.{interface,mongo}.ts, monitor.model.ts,
│   │                  # monitor.schema.ts, monitor.type.ts, monitor.errors.ts
│   ├── checks/
│   ├── incidents/
│   ├── jobs/          # Job table that drives scheduling (see Monitoring flow)
│   └── …              # users, teams, status-pages, notifications, heartbeat, docker, etc.
├── worker/          # Job scheduler, DB-backed queue worker, check pipeline, reactors, health server
├── service/         # Cross-cutting services: statusService, emailService, bufferService, networkProviders/
├── config/          # App config wiring (controllers, routes, services, envValidation)
├── db/
│   └── migration/   # Database migrations (run on startup)
├── templates/       # Email/notification templates
├── types/           # Ambient and shared TS types (express.d.ts, network, query, upload)
└── utils/           # Shared utilities (logger, AppError, …)
```

### Frontend Structure
```
client/src/
├── Components/      # Reusable UI components
├── Pages/           # Page components (Auth, Uptime, Infrastructure, Incidents, etc.)
├── Routes/          # Route definitions
├── Features/        # Redux slices (Auth, UI)
├── Hooks/           # Custom React hooks
├── Types/           # Shared client types
├── Utils/           # Utilities (ApiClient.ts is the main API client)
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
- **Scheduling/Queue**: MongoDB-backed job table polled by in-process workers (no Redis)
- **i18n**: i18next + react-i18next (non-English locales are machine translated, not managed through a translation service)

---

## Backend Architecture Patterns

### Repository Pattern & Separation of Concerns

The backend enforces a strict three-layer separation between HTTP handling, business logic, and data access:

```
Request → Controller → Service → Repository → MongoDB (Mongoose)
```

- **Controllers** (`api/controllers`) handle HTTP concerns only. Each method is a plain `async` arrow that parses the request with a Zod schema, calls the appropriate service with the parse result, and writes `res.json({ success, msg, data })`. No wrapper is needed: Express 5 forwards rejected promises to `handleErrors`, which maps `ZodError` to 400 and `AppError` to its definition's status. They contain no business logic.
- **Services** (`domain/<entity>/<entity>.service.ts`, plus cross-cutting ones in `service/`) contain all business logic: deciding whether an incident should be created, whether a notification should fire, what state a monitor is in, etc.
- **Repositories** (`domain/<entity>/<entity>.repository.mongo.ts`, behind `<entity>.repository.interface.ts`) are the sole layer that talks to MongoDB through Mongoose. They expose clean, reusable query methods (e.g. `findByMonitorId`, `createCheck`) so that services never construct raw DB queries directly.

This separation makes each layer independently testable and keeps Mongoose-specific code out of business logic. When adding a new feature, the pattern to follow is: add a repository method for any new DB query, call it from a service, and expose it via a controller route.

### Monitoring Flow: From Check to Notification

Background monitoring runs on a MongoDB-backed job queue, not on the HTTP request cycle. Code lives in `server/src/worker/`. The flow for a check is:

```
Job row (domain/jobs) ──claimed by──▶ DBQueueWorker ──"check" job──▶ WorkerPipeline.handleCheck
                                                                       ├── skips if in a maintenance window
                                                                       ├── probes via providerRegistry (service/networkProviders)
                                                                       └── adds the Check to BufferService
BufferService (flushes every minute) ──▶ WorkerPipeline.ingestChecks ──▶ inserts Checks, arms an "evaluate" job
"evaluate" job ──▶ WorkerPipeline.evaluateCheck ──▶ statusService.updateMonitorStatus
                                                └── ReactorDispatcher ──▶ IncidentReactor, NotificationReactor
```

1. **Scheduling.** Each active monitor has a row in the `jobs` collection (`domain/jobs/job.model.ts`) with `nextScheduledAt` and `intervalMs`, taken from the monitor's `interval` (milliseconds). `JobScheduler` (`worker.job-scheduler.ts`) creates, updates, pauses and deletes these rows as monitors change, and seeds them on startup.
2. **Claiming.** `DBQueueWorker` (`worker.db-queue.ts`) polls per job type (`check`, `geo-check`, `evaluate`, cleanup, telemetry), claims due rows by setting a lock (`lockedBy`/`lockedUntil`), and renews the lock while a job runs, so several workers can share one database safely.
3. **Probing.** `WorkerPipeline.handleCheck` (`worker.pipeline.ts`) skips monitors in a maintenance window (setting status `maintenance`), probes the target through the provider registry, and pushes the `Check` into `BufferService`.
4. **Ingestion.** `BufferService` flushes on a timer (1 minute; 1 second in development). `ingestChecks` writes the checks and arms an `evaluate` job per monitor.
5. **Evaluation and reactions.** `evaluateCheck` calls `statusService.updateMonitorStatus`, which applies the status window and threshold. `ReactorDispatcher` then runs the reactors in `worker/reactors/`: `IncidentReactor` opens or resolves incidents and `NotificationReactor` sends alerts to the monitor's notification channels.

### Queue behaviour

- `QUEUE_MODE=primary` runs the API, the web client and the scheduler; `QUEUE_MODE=worker` runs only a job-processing worker. `QUEUE_PRIMARY_PROCESSES=false` stops a primary node from processing checks itself. Workers register in the `queueworkers` collection (`domain/queue-workers`).
- A failed job records `failCount` and `lastFailReason`, releases its lock and is pushed back by a short backoff. There is no dead-letter step in the job runner.
- Health and metrics (`/livez`, `/readyz`, `/metrics`) are served on `HEALTH_PORT` by `worker.health-server.ts`.

When working on check scheduling, incident lifecycle or notifications, trace the flow from `worker/` rather than from the controller layer.

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
8. Mongoose schema fields with closed value sets must declare `enum` reusing the same const tuple, which lives in the entity's `domain/<entity>/<entity>.type.ts` (e.g. `MonitorStatuses` in `monitor.type.ts`).
9. Provider tests at `server/test/unit/providers/network/<name>.test.ts`, `from "@jest/globals"`, `testStatusProviderContract`, inline `setup()` per test (not `beforeEach`).
10. Centralize validation enums in those `<entity>.type.ts` const tuples; never inline `z.enum([…])` more than once.
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

Mongoose models live next to their entity in `server/src/domain/<entity>/<entity>.model.ts`. Key ones:
- **Monitor** - Monitoring configuration (website, infrastructure, port, etc.)
- **Check** - Individual monitoring check results
- **Incident** - Downtime incidents
- **User** - User accounts
- **Team** - Team/workspace management
- **StatusPage** - Public status pages
- **Notification** - Alert configuration (email, Discord, Slack, webhooks)
- **MaintenanceWindow** - Scheduled maintenance periods
- **AppSettings** - Global application settings
- **Job** - Scheduled work for the queue (checks, evaluations, cleanup, telemetry)