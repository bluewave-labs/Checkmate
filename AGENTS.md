# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
npm test                    # Run all tests with coverage
npm test -- --grep "pattern"  # Run specific tests
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
