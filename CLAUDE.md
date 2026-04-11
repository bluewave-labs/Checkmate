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
npm run test             # Run Mocha tests with c8 coverage
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
DB_TYPE="mongodb"           # mongodb (default) or timescaledb
TOKEN_TTL="99d"
ORIGIN="localhost"
LOG_LEVEL="debug"           # error | warn | info | debug
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
├── Utils/           # Utilities (ApiClient.ts is the main Axios client)
├── Validation/      # Input validation
└── locales/         # i18n translations
```

`ApiClient.ts` injects Bearer tokens from Redux auth state on every request and redirects to `/login` on 401. It also detects `ERR_NETWORK` to trigger the offline banner via `setServerUnreachableCallback()`.

### API
- Base URL: `/api/v1`
- Documentation: `http://localhost:52345/api-docs` (Swagger UI)
- OpenAPI spec: `/server/openapi.json`

### Key Technologies
- **State Management**: Redux Toolkit + Redux-Persist
- **Data Fetching**: SWR + Axios
- **Database**: MongoDB (default) or TimescaleDB/PostgreSQL — selected via `DB_TYPE` env var
- **Job Scheduler**: `super-simple-scheduler` (in-memory, NOT Redis/BullMQ/Pulse despite those being listed as dependencies)
- **i18n**: i18next + react-i18next (translations via PoEditor)

## Code Conventions

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
Server tests use Mocha + Chai + Sinon:
```bash
npm test                         # Run all tests with coverage
npm run test:services            # Run only service/provider tests
npm test -- --grep "pattern"     # Run tests matching a string pattern
```
Test files: `server/tests/**/*.test.js`

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

## Monitoring Loop Architecture

On startup, `initializeServices()` in `server/src/config/services.ts` wires up a dependency-injection graph:
1. Connects DB (MongoDB or TimescaleDB based on `DB_TYPE`)
2. Instantiates the matching repository implementations (`Mongo*Repository` or `Timescale*Repository`)
3. Creates all network check providers (HTTP, Ping, Port, Docker, Hardware, PageSpeed, GameDig, GRPC, WebSocket)
4. Creates all notification providers (email, Slack, Discord, Teams, Telegram, PagerDuty, Matrix, webhook)
5. Creates `SuperSimpleQueue` with a `SuperSimpleQueueJobHelper` that ties it all together

**Job templates registered at startup:**
- `monitor-job` — executes each monitor's check on its configured interval
- `geo-check-job` — geo-distributed check for supported HTTP monitors
- `cleanup-orphaned` / `cleanup-retention-job` — database cleanup (every 24h)

**Per-check execution order** (in `SuperSimpleQueueJobHelper`):
1. Skip if monitor is in an active maintenance window
2. Run the appropriate network provider check
3. Buffer result via `BufferService`
4. Update monitor status via `StatusService`
5. Call `evaluateMonitorAction()` → produces 4 decision flags:
   - `shouldCreateIncident` / `shouldResolveIncident` (status down/breached/recovered)
   - `shouldSendNotification` / reason (only fires on status *changes*, not every check)
6. Dispatch notifications and incident mutations fire-and-forget (non-blocking)

## Repository Pattern

Every entity has an interface (e.g., `IMonitorsRepository`) with concrete implementations for each supported database. The correct implementation is selected at startup and injected into all services — services never import a concrete repository class directly. When adding a new DB operation, add the method to the interface and implement it in all concrete classes.

Repositories live in `server/src/repositories/`; service constructors accept the interface type.
