# Checkmate

A full‑stack uptime and infrastructure monitoring app. The repository contains an Express/TypeScript API and a React/TypeScript client.

## Project Structure
- `server/` – Node.js API (TypeScript, ESM)
  - Source: `server/src`
  - Routes mounted under `/api/v1/*` via `server/src/init/routes.ts`
  - Tests: `server/tests`
  - Build output: `server/dist`
- `client/` – React + TypeScript (Vite)
  - Source: `client/src`
  - Public assets: `client/public`

## Key Features
- JWT authentication and permission checks (team/org).
- Monitors API: create, list (with sorting/pagination), get checks, toggle pause, update, delete.
- Import/Export monitors (`GET /api/v1/monitors/export`, `POST /api/v1/monitors/import`).
- Notification channels and diagnostics endpoints.
- System settings (SMTP) with env‑first email transport fallback to DB settings.

## Getting Started
1. Prerequisites: Node 18+, MongoDB
2. Environment
   - Server: create `server/.env` with at least:
     - `MONGODB_URI=mongodb://localhost:27017/saas`
     - `JWT_SECRET=replace_me`
     - `ORIGIN=http://localhost:5173`
     - Optional SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
3. Install
   - `cd server && npm ci`
   - `cd ../client && npm ci`
4. Run
   - API: `cd server && npm run dev` (listens on `http://localhost:52345`)
   - Client: `cd client && npm run dev` (Vite dev server)

## Scripts
- Server
  - `npm run dev` – Start API in watch mode
  - `npm run build` – Type‑check and compile (tsc + tsc‑alias)
  - `npm test` / `npm run test:coverage` – Jest tests and coverage
- Client
  - `npm run dev` – Start Vite dev server
  - `npm run build` – Type‑check and build
  - `npm run preview` – Preview production build

## Notes
- The API expects valid JWTs on most routes; see `server/src/routes` for middleware usage.
- Mongo connection retries are handled in `server/src/db/MongoDB.ts`.
- Email transport prioritizes env config; if unset, it uses values from system settings.
