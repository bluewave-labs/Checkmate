# Monitor Interval Scheduling: Issue Analysis & Resolution

## 1. Overview & Problem Statement

### Symptoms
In Checkmate environments running multiple monitors, instances experienced severe performance degradation:
- Monitors produced checks continuously (**~40–50 checks/second** across ~39 monitors) instead of honoring their configured intervals (e.g. once every 5 minutes).
- Sustained high CPU utilization on host instances (**Node.js ~50–80%**, **mongod ~40–60%**), triggering VPS CPU throttling and potential denial of service.
- Excessive database storage growth (**~4,000,000 check records/day**), bloating collections and exhausting disk space.

### Root Cause Analysis
1. **Unit Mismatch (Seconds vs. Milliseconds)**:
   - Monitor intervals in Checkmate were stored or configured in **seconds** (e.g. `300` for 5 minutes, `3600` for 1 hour, or `86400` for 1 day).
   - The queue worker system consumed `job.intervalMs` strictly in **milliseconds**.
   - When the scheduler seeded check jobs into the `jobs` collection, it assigned `intervalMs: monitor.interval` without unit conversion.
   - A 5-minute monitor (`interval: 300`) was scheduled with `intervalMs: 300`, which the queue worker interpreted as **300 milliseconds**, executing ~3.3 checks per second per monitor.
2. **Reconciliation Overwrite**:
   - On server reboot or scheduler initialization, the `reconcile()` routine re-derived jobs from `monitor.interval`.
   - Any manual in-database corrections to `job.intervalMs` were reverted back to `300` on the next server restart.

---

## 2. Multi-Layer Resolution Strategy

To permanently eliminate this issue, a defense-in-depth approach was implemented across all layers of the application:

```
┌────────────────────────────────────────────────────────┐
│                   1. API Ingestion                     │
│  Validates & transforms incoming intervals to ms       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 2. Database Migration                  │
│  Converts legacy DB records (interval * 1000)          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│               3. Repository & Domain                   │
│  Guarantees entity retrieval normalizes to ms          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                  4. Job Scheduler                      │
│  toCheckJob, toGeoCheckJob & updateJob schedule in ms  │
└────────────────────────────────────────────────────────┘
```

### Layer 1: Domain Helper & Thresholds
- **File**: `server/src/domain/monitors/monitor.type.ts`
- **Change**:
  - Defined `MIN_MONITOR_INTERVAL_MS = 10000` (10 seconds minimum).
  - Implemented `normalizeIntervalMs(interval: number | undefined | null): number`:
    - Values `< 10000` (or equal to `86400` for 1 day in seconds) are recognized as seconds and converted to milliseconds (`interval * 1000`).
    - Values `>= 10000` already in milliseconds are preserved.
    - Missing, non-positive, or null intervals default safely to `60000` (1 minute).

### Layer 2: Job Scheduler Normalization
- **File**: `server/src/worker/worker.job-scheduler.ts`
- **Change**:
  - `toCheckJob()`: Uses `normalizeIntervalMs(monitor.interval)` for `intervalMs` and herd-avoidance jitter calculation (`now + Math.floor(Math.random() * intervalMs)`).
  - `toGeoCheckJob()`: Uses `normalizeIntervalMs(monitor.geoCheckInterval ?? 300000)`.
  - `updateJob()`: Normalizes the monitor interval to milliseconds when updating active schedules via `updateScheduleById()`.

### Layer 3: Repository Entity & Scheduling Mapping
- **File**: `server/src/domain/monitors/monitor.repository.mongo.ts`
- **Change**:
  - `findAllForScheduling()`: Normalizes `interval` and `geoCheckInterval` when fetching monitor schedule fields for queue reconciliation.
  - `toEntity()`: Normalizes `interval` and `geoCheckInterval` when hydrating domain entities from raw Mongo documents.

### Layer 4: API & Bulk Import Validation
- **File**: `server/src/api/validation/monitorValidation.ts`
- **Change**:
  - Created `intervalValidation = z.number().positive().transform(val => normalizeIntervalMs(val))`.
  - Applied to `createMonitorBodyValidation`, `editMonitorBodyValidation`, and `importMonitorsBodyValidation` (`importedMonitorSchema`).
  - Ensures any payload submitted in seconds is transformed into milliseconds immediately upon ingestion.

### Layer 5: Database Migration
- **Files**:
  - `server/src/db/migration/0013_migrateMonitorIntervalToMs.ts`
  - `server/src/db/migration/index.ts`
- **Change**:
  - Registered migration `0013_migrateMonitorIntervalToMs` to run automatically on server boot.
  - Updates all existing documents in `monitors` and `jobs` (where `type: "check"`) whose interval is `< 10000` or `86400`, multiplying them by `1000`.

### Layer 6: Cross-Platform Test Compatibility
- **Files**:
  - `server/test/helpers/throwScanner.ts`
  - `server/test/unit/routes/routeErrors.test.ts`
- **Change**:
  - Normalized file path separators (`.replaceAll("\\", "/")`) in definition resolution so that route error documentation tests pass on Windows systems as well as Linux/macOS.

---

## 3. Verification & Test Results

### Automated Unit Test Suites
New tests were added covering all aspects of the resolution:
1. `server/test/unit/utils/normalizeIntervalMs.test.ts`: Unit conversions from seconds to ms, preservation of ms, edge cases.
2. `server/test/unit/services/jobScheduler.test.ts`: Interval normalization during seed and update.
3. `server/test/unit/validation/monitorValidation.test.ts`: Schema validation transformations for creation, editing, and JSON imports.
4. `server/test/unit/services/migrateMonitorIntervalToMs.test.ts`: DB migration logic and query filtering.

### Verification Run
- **TypeScript Typecheck**:
  ```bash
  npx tsc --noEmit
  # Result: 0 errors
  ```
- **Jest Test Suite**:
  ```bash
  npx jest --forceExit test/unit
  # Result:
  # Test Suites: 90 passed, 90 total (100%)
  # Tests:       1907 passed, 1907 total (100%)
  # Time:        19.134 s
  ```

---

## 4. Modified & Added Files Summary

| File Path | Status | Purpose |
| :--- | :--- | :--- |
| `server/src/domain/monitors/monitor.type.ts` | Modified | Added `MIN_MONITOR_INTERVAL_MS` & `normalizeIntervalMs()` helper |
| `server/src/worker/worker.job-scheduler.ts` | Modified | Applied interval normalization to `toCheckJob`, `toGeoCheckJob`, and `updateJob` |
| `server/src/domain/monitors/monitor.repository.mongo.ts` | Modified | Guaranteed normalized intervals in `findAllForScheduling` and `toEntity` |
| `server/src/api/validation/monitorValidation.ts` | Modified | Added interval schema transform for creation, edits, and imports |
| `server/src/db/migration/0013_migrateMonitorIntervalToMs.ts` | Added | MongoDB migration for existing monitors and check jobs |
| `server/src/db/migration/index.ts` | Modified | Registered migration 0013 into migration runner |
| `server/test/unit/utils/normalizeIntervalMs.test.ts` | Added | Unit tests for interval normalization logic |
| `server/test/unit/services/migrateMonitorIntervalToMs.test.ts` | Added | Unit tests for database migration |
| `server/test/unit/services/jobScheduler.test.ts` | Modified | Added interval test cases for scheduler |
| `server/test/unit/validation/monitorValidation.test.ts` | Modified | Added interval test cases for schemas |
| `server/test/helpers/throwScanner.ts` | Modified | Cross-platform POSIX path normalization for throw scanner |
| `server/test/unit/routes/routeErrors.test.ts` | Modified | Cross-platform POSIX catalog path normalization |
