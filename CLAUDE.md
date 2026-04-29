# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Checkmate is an open-source uptime and infrastructure monitoring application. It monitors server hardware, uptime, response times, and incidents with real-time alerts. The companion agent [Capture](https://github.com/bluewave-labs/capture) provides infrastructure metrics (CPU, RAM, disk, temperature).

## Development Commands

### Client (React/Vite)
```bash
cd client
npm install
npm run dev              # Start dev server at http://localhost:5173
npm run build            # TypeScript check + production build
npm run lint             # ESLint (strict, max-warnings 0)
npm run format           # Prettier formatting
npm run format-check     # Check formatting
```

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
cd docker/dev
./build_images.sh
docker run -d -p 27017:27017 -v uptime_mongo_data:/data/db --name uptime_database_mongo mongo:6.0
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
- `/server` - Node.js 20+ + Express + TypeScript backend
- `/docker` - Multi-environment Docker configs (dev, staging, prod, arm, mono)

### Backend Layers
```
server/src/
├── controllers/     # Route handlers (authController, monitorController, etc.)
├── service/         # Business logic
│   ├── business/    # Core monitoring logic
│   ├── infrastructure/  # Server/system utilities
│   └── system/      # App-level settings
├── db/
│   ├── models/      # Mongoose schemas (Monitor, Check, Incident, User, etc.)
│   ├── migration/   # Database migrations (run on startup)
│   └── modules/     # Database-specific modules
├── middleware/v1/   # verifyJWT, rateLimiter, sanitization, responseHandler
├── routes/v1/       # API route definitions
├── validation/      # Joi input validation schemas
└── repositories/    # Data access layer
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
- OpenAPI spec: `/server/openapi.json`

### Key Technologies
- **State Management**: Redux Toolkit + Redux-Persist
- **Data Fetching**: SWR + Axios
- **Database**: MongoDB with Mongoose ODM
- **Queue/Cache**: Redis + BullMQ + Pulse (cron scheduling)
- **i18n**: i18next + react-i18next (translations via PoEditor)

---

## Backend Architecture Patterns

### Repository Pattern & Separation of Concerns

The backend enforces a strict three-layer separation between HTTP handling, business logic, and data access:

```
Request → Controller → Service → Repository → MongoDB (Mongoose)
```

- **Controllers** (`/controllers`) handle HTTP concerns only: parsing request params, calling the appropriate service, and returning a response via the `responseHandler` middleware. They contain no business logic.
- **Services** (`/service/business`) contain all business logic: deciding whether an incident should be created, whether a notification should fire, what state a monitor is in, etc.
- **Repositories** (`/repositories`) are the sole layer that talks to MongoDB through Mongoose. They expose clean, reusable query methods (e.g. `findByMonitorId`, `createCheck`) so that services never construct raw DB queries directly.

This separation makes each layer independently testable and keeps Mongoose-specific code out of business logic. When adding a new feature, the pattern to follow is: add a repository method for any new DB query, call it from a service, and expose it via a controller route.

### Monitoring Flow: From Check to Notification

Background monitoring runs on a scheduled queue, not on the HTTP request cycle. The high-level flow for uptime monitoring is:

```
Pulse (cron) → BullMQ Job → StatusService
                                 ├── performs HTTP/port/ping check
                                 ├── saves Check via CheckRepository
                                 ├── evaluates monitor state change
                                 │     └── calls IncidentService (create / resolve incident)
                                 └── calls NotificationService (email, Slack, Discord, webhook)
```

1. **Pulse** (cron scheduler) enqueues a job into a **BullMQ** queue for each active monitor at its configured interval.
2. A **BullMQ worker** picks up the job and calls `StatusService`, which performs the actual check (HTTP request, TCP port probe, ping, etc.).
3. The result is persisted as a `Check` document via the repository layer.
4. `StatusService` compares the new result against the monitor's previous state. If the monitor transitions from up → down (or down → up), it delegates to `IncidentService` to open or resolve an `Incident` document.
5. On a state change, `NotificationService` reads the monitor's configured `Notification` documents and dispatches alerts to all enabled channels (email, Discord, Slack, webhooks).

### Queue System (BullMQ + Redis)

Redis serves two roles: job queue storage for BullMQ and ephemeral caching. BullMQ manages concurrency, retries, and backpressure for monitoring jobs, ensuring checks are processed reliably even under load.

- Each monitor type (HTTP, port, ping, infrastructure) maps to its own queue worker so failures in one type don't block others.
- Job scheduling interval is driven by the `interval` field on the `Monitor` model.
- Failed jobs are retried with configurable backoff before being moved to a dead-letter state.
- Redis is also used to cache frequently read data (e.g. aggregated stats) to reduce MongoDB query pressure.

When working on anything related to check scheduling, incident lifecycle, or notifications, trace the flow starting from the relevant BullMQ worker rather than from the controller layer.

---

## Code Conventions

### Frontend conventions (mandatory for `client/src`)
Read `docs/frontend-conventions.md` before touching any `.tsx` file. Five rules, all enforced in code review:
1. Prefer MUI native props over `sx` (e.g. `color={…}`, `bgcolor={…}`, `mt={…}` — not `sx={{ color, bgcolor, mt }}`).
2. Use the full theme path for colors: `color={theme.palette.text.secondary}`, never `color="text.secondary"` (greppability).
3. No hardcoded literals — use `LAYOUT.*`, `typographyLevels.*`, `theme.shape.borderRadius`, `theme.palette.*`.
4. Use `useTheme()` inside components; don't `import { theme } from "@/Utils/Theme/Theme"`.
5. Pair runtime tuples with derived types: `const X = [...] as const; type X = (typeof X)[number]`.

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