# Checkmate Codebase Architecture - Docker Monitoring Integration Guide

## 1. PROJECT STRUCTURE

### Directory Layout
```
Checkmate/
├── server/                      # Backend Node.js/Express
│   ├── src/
│   │   ├── db/v1|v2/           # Database (MongoDB)
│   │   ├── service/v1|v2/      # Business logic
│   │   ├── routes/v1|v2/       # API routes
│   │   ├── controllers/v1|v2/  # HTTP request handlers
│   │   ├── middleware/v1/      # Express middleware
│   │   ├── config/             # Service initialization
│   │   ├── validation/         # Input validation
│   │   └── utils/              # Helper functions
│   └── package.json            # Dependencies (Node >=20)
├── client/                      # Frontend React + TypeScript
│   ├── src/
│   │   ├── Components/v1|v2/   # UI Components
│   │   ├── Pages/v1|v2/        # Page layouts
│   │   ├── Hooks/              # React hooks (data fetching)
│   │   ├── Features/           # Redux slices
│   │   └── Utils/              # Utilities & API client
│   └── package.json            # React, Vite, MUI
└── docker/                      # Deployment configs
```

### Technology Stack
**Backend:**
- Express 4.19 (HTTP server)
- MongoDB 8.3 (database)
- Mongoose (ODM)
- BullMQ 5.41 (job queue) - V2 only
- super-simple-scheduler 1.4 (job scheduling) - V1
- Dockerode 4.0.6 (Docker API client)
- JWT authentication
- Winston (logging)

**Frontend:**
- React 18.3 + TypeScript
- Vite (build tool)
- MUI v6 (Material-UI)
- Redux Toolkit (state management)
- Axios (HTTP client)
- React Router (navigation)
- i18next (internationalization)

**Architectures:**
- V1: Simpler, SuperSimpleQueue-based job scheduling
- V2: TypeScript-based, BullMQ, more structured (in development)

---

## 2. MONITOR TYPES & IMPLEMENTATION

### Supported Monitor Types
Defined in `/server/src/db/v1/models/Monitor.js` line 46:
```javascript
type: {
    enum: ["http", "ping", "pagespeed", "hardware", "docker", "port", "game"],
    required: true
}
```

### How Monitor Types Are Handled

#### Request Dispatch (NetworkService)
**Location:** `/server/src/service/v1/infrastructure/networkService.js` (580 lines)

Entry point: `requestStatus(monitor)` - Routes to type-specific handlers:
```javascript
async requestStatus(monitor) {
    switch(monitor.type) {
        case "ping":        return await this.requestPing(monitor);
        case "http":        return await this.requestHttp(monitor);
        case "pagespeed":   return await this.requestPageSpeed(monitor);
        case "hardware":    return await this.requestHardware(monitor);
        case "docker":      return await this.requestDocker(monitor);
        case "port":        return await this.requestPort(monitor);
        case "game":        return await this.requestGame(monitor);
    }
}
```

#### DOCKER IMPLEMENTATION (Lines 289-383)
```javascript
async requestDocker(monitor) {
    // Uses Dockerode to connect to /var/run/docker.sock
    const docker = new this.Docker({
        socketPath: "/var/run/docker.sock",
        handleError: true,
    });
    
    // Container matching (priority-based):
    // 1. Exact full ID match (64-char)
    // 2. Exact name match (case-insensitive)
    // 3. Partial ID match (backwards compatibility)
    
    // Returns: { status: bool, code: int, message: string, responseTime: ms }
}
```

**Docker Monitor Storage:**
- `monitor.url`: Container ID or name (e.g., "my-app" or "a1b2c3d4...")
- `monitor.port`: Not used for Docker
- Returns: Only status and response time (no detailed metrics)

#### HARDWARE IMPLEMENTATION (Lines 279-287)
```javascript
async requestHardware(monitor) {
    return await this.requestHttp(monitor);  // Delegates to HTTP!
}
```
Hardware monitors send HTTP requests to Capture API endpoint with secret authentication.

### Hardware/Docker Check Data Structure
**Location:** `/server/src/db/v1/models/Check.js` (176 lines)

Check schema includes:
```javascript
// Common fields
monitorId, teamId, type, status, responseTime, message

// Hardware/Docker specific (capture data):
cpu: {
    physical_core, logical_core, frequency, temperature[],
    free_percent, usage_percent
},
memory: {
    total_bytes, available_bytes, used_bytes, usage_percent
},
disk: [{
    read_speed_bytes, write_speed_bytes,
    total_bytes, free_bytes, usage_percent
}],
host: { os, platform, kernel_version },
errors: [{ metric[], err }],
capture: { version, mode },
net: [{ name, bytes_sent, bytes_recv, ... }]
```

**TTL:** Auto-deletes after 30 days
**Indexes:** monitorId, type, status, updatedAt (optimized for queries)

---

## 3. DATABASE SCHEMA

### Core Models

#### Monitor Model
**File:** `/server/src/db/v1/models/Monitor.js` (208 lines)

```javascript
{
    userId: ObjectId (immutable, required),
    teamId: ObjectId (immutable, required),
    name: String (required),
    description: String,
    type: String (enum: http|ping|pagespeed|hardware|docker|port|game),
    url: String (required) // container name/ID for docker
    port: Number,
    interval: Number (ms, default: 60000),
    isActive: Boolean (default: true),
    status: Boolean, // Current up/down
    statusWindow: [Boolean], // Last N checks
    statusWindowSize: Number (default: 5),
    statusWindowThreshold: Number (default: 60),
    
    // Hardware/Docker thresholds
    thresholds: {
        usage_cpu: Number (0-1),
        usage_memory: Number (0-1),
        usage_disk: Number (0-1),
        usage_temperature: Number
    },
    
    // Notification thresholds
    alertThreshold: Number (default: 5),
    cpuAlertThreshold, memoryAlertThreshold, diskAlertThreshold, tempAlertThreshold,
    
    // Relationships
    notifications: [ObjectId], // refs to Notification model
    
    // Advanced
    secret: String, // For Capture API auth
    ignoreTlsErrors: Boolean,
    jsonPath: String,
    expectedValue: String,
    matchMethod: String (equal|include|regex),
    gameId: String,
    group: String (max 50 chars),
    
    // Computed
    uptimePercentage: Number,
    
    timestamps: true // createdAt, updatedAt
}

// Indexes
MonitorSchema.index({ teamId: 1, type: 1 });

// Pre-hooks
pre("findOneAndDelete"): Deletes checks, stats, removes from status pages
pre("deleteMany"): Cascade deletes
pre("save"): Syncs alertThresholds
pre("findOneAndUpdate"): Updates thresholds
```

#### Check Model
**File:** `/server/src/db/v1/models/Check.js`

```javascript
{
    monitorId: ObjectId (ref: Monitor, immutable, indexed),
    teamId: ObjectId (ref: Team, immutable, indexed),
    type: String (enum: http|ping|pagespeed|hardware|docker|port|game, indexed),
    status: Boolean (indexed),
    responseTime: Number,
    timings: Object,
    statusCode: Number,
    message: String,
    
    // Acknowledgment
    ack: Boolean (default: false),
    ackAt: Date,
    
    // Hardware fields (see above)
    cpu, memory, disk[], host, errors[], capture, net[]
    
    // PageSpeed only
    accessibility, bestPractices, seo, performance, audits,
    
    // Expiry
    expiry: Date (TTL index: 30 days),
    timestamps: true
}

// Indexes
CheckSchema.index({ updatedAt: 1 });
CheckSchema.index({ monitorId: 1, updatedAt: 1 });
CheckSchema.index({ monitorId: 1, updatedAt: -1 });
CheckSchema.index({ teamId: 1, updatedAt: -1 });
```

#### MonitorStats Model
**File:** `/server/src/db/v1/models/MonitorStats.js`

```javascript
{
    monitorId: ObjectId (ref: Monitor, immutable, indexed),
    avgResponseTime: Number,
    totalChecks: Number,
    totalUpChecks: Number,
    totalDownChecks: Number,
    uptimePercentage: Number,
    lastCheckTimestamp: Number,
    lastResponseTime: Number,
    timeOfLastFailure: Number,
    timestamps: true
}
```

### Database Access Layer
**Location:** `/server/src/db/v1/modules/`

- `MonitorModule.js` (593 lines) - Monitor CRUD + aggregations
- `CheckModule.js` - Check recording
- `MonitorModuleQueries.js` - MongoDB aggregation pipelines

**Key Methods:**
```javascript
// Creation
Monitor.createMonitor({ body, teamId, userId })
Monitor.createBulkMonitors(monitors)

// Retrieval
Monitor.getMonitorById(id)
Monitor.getMonitorsByTeamId()
Monitor.getMonitorStatsById()
Monitor.getHardwareDetailsById()

// Updates
Monitor.updateMonitor(id, updateData)

// Deletions
Monitor.deleteMonitor(id)
```

---

## 4. API PATTERNS

### REST Endpoint Structure
**Base:** `/api/v1/`

#### Monitor Routes
**File:** `/server/src/routes/v1/monitorRoute.js`

```
GET    /monitors                    getAllMonitors
POST   /monitors                    createMonitor
DELETE /monitors                    deleteAllMonitors (superadmin)

GET    /monitors/:monitorId         getMonitorById
PUT    /monitors/:monitorId         editMonitor (admin)
DELETE /monitors/:monitorId         deleteMonitor (admin)

GET    /monitors/team               getMonitorsByTeamId
GET    /monitors/team/with-checks   getMonitorsWithChecksByTeamId
GET    /monitors/team/summary       getMonitorsSummaryByTeamId
GET    /monitors/team/groups        getGroupsByTeamId

GET    /monitors/stats/:monitorId   getMonitorStatsById
GET    /monitors/uptime/details/:monitorId   getUptimeDetailsById
GET    /monitors/hardware/details/:monitorId getHardwareDetailsById

POST   /monitors/pause/:monitorId   pauseMonitor (admin)
POST   /monitors/demo               addDemoMonitors
POST   /monitors/bulk               createBulkMonitors (CSV upload)
POST   /monitors/test-email         sendTestEmail

GET    /monitors/games              getAllGames
GET    /monitors/certificate/:monitorId fetchCertificate
```

#### Check Routes
**File:** `/server/src/routes/v1/checkRoute.js`

```
GET    /checks/:monitorId           getChecksByMonitorId
GET    /checks/team/:teamId         getChecksByTeamId
GET    /checks/:monitorId/:checkId  getCheckById
PUT    /checks/:checkId             updateCheck (ack)
```

### Request/Response Pattern

**Create Monitor Request:**
```javascript
POST /api/v1/monitors
Authorization: Bearer <JWT>
Content-Type: application/json

{
    name: "My Docker Container",
    description: "Monitors app container",
    type: "docker",
    url: "my-app-container",           // Container name
    interval: 60000,                   // 1 minute
    isActive: true,
    secret: "api-key-for-capture",     // If using hardware monitoring
    notifications: ["notif-id-1"],
    thresholds: {
        usage_cpu: 0.8,                // 80%
        usage_memory: 0.9,             // 90%
        usage_disk: 0.95
    },
    alertThreshold: 5,                 // Consecutive failures
    statusWindowSize: 5,               // Last 5 checks
    statusWindowThreshold: 60          // % threshold
}

Response 200:
{
    data: {
        _id: "monitor-id",
        name: "My Docker Container",
        type: "docker",
        status: true,
        interval: 60000,
        ...
    },
    msg: "Monitor created successfully"
}
```

**Edit Monitor Request:**
```javascript
PUT /api/v1/monitors/:monitorId

{
    name: "Updated Name",
    interval: 120000,
    thresholds: { usage_cpu: 0.85 },
    // Partial updates allowed
}
```

### Authentication & Authorization

**JWT Middleware:** `/server/src/middleware/v1/verifyJWT.js`
- Header: `Authorization: Bearer <token>`
- Validates signature using `jwtSecret` from AppSettings
- Extracts user info: `req.user = { userId, teamId, role, ... }`

**Role-Based Access:**
```javascript
// isAllowed middleware checks req.user.role
router.post("/monitors", isAllowed(["admin", "superadmin"]), createMonitor);
router.delete("/monitors/:monitorId", isAllowed(["admin", "superadmin"]), deleteMonitor);
```

### Validation
**File:** `/server/src/validation/joi.js`

```javascript
const createMonitorBodyValidation = joi.object({
    name: joi.string().required(),
    description: joi.string().required(),
    type: joi.string().required(),
    url: joi.string().required(),
    interval: joi.number(),
    port: joi.number(),
    thresholds: joi.object().keys({
        usage_cpu: joi.number(),
        usage_memory: joi.number(),
        usage_disk: joi.number(),
        usage_temperature: joi.number(),
    }),
    notifications: joi.array().items(joi.string()),
    secret: joi.string(),
    // ... more fields
});
```

---

## 5. POLLING/JOBS IMPLEMENTATION

### Job Queue Architecture

#### V1: SuperSimpleScheduler (Production)
**Files:**
- `/server/src/service/v1/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js`
- `/server/src/service/v1/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js`

**Job Lifecycle:**

1. **Initialization** (on server startup):
```javascript
// Load all monitors from DB
const monitors = await db.monitorModule.getAllMonitors();
for (const monitor of monitors) {
    // Add job with random offset (0-100ms)
    this.addJob(monitor._id, monitor);
}

// Register job template
scheduler.addTemplate("monitor-job", this.helper.getMonitorJob());
```

2. **Job Template** (executed per interval):
```javascript
getMonitorJob = () => {
    return async (monitor) => {
        // Check maintenance window
        if (await this.isInMaintenanceWindow(monitorId, teamId)) {
            return; // Skip
        }
        
        // Execute monitor check
        const networkResponse = await this.networkService.requestStatus(monitor);
        
        // Update monitor status
        const { monitor: updated, statusChanged } = 
            await this.statusService.updateStatus(networkResponse);
        
        // Send notifications if status changed
        if (statusChanged) {
            await this.notificationService.handleNotifications({
                ...networkResponse,
                monitor: updated,
                prevStatus,
                statusChanged
            });
        }
    };
};
```

3. **Job Control:**
```javascript
// Add job
addJob(monitorId, monitor) {
    scheduler.addJob({
        id: monitorId.toString(),
        template: "monitor-job",
        repeat: monitor.interval,      // Milliseconds
        active: monitor.isActive,
        data: monitor.toObject()
    });
}

// Pause/Resume
pauseJob(monitor) { scheduler.pauseJob(monitor._id); }
resumeJob(monitor) { scheduler.resumeJob(monitor._id); }

// Update interval
updateJob(monitor) {
    scheduler.updateJob(monitor._id, {
        repeat: monitor.interval,
        data: monitor.toObject()
    });
}

// Delete
deleteJob(monitor) { scheduler.removeJob(monitor._id); }
```

#### V2: BullMQ (TypeScript, Planned)
**Files:**
- `/server/src/service/v2/infrastructure/JobQueue.ts`
- `/server/src/service/v2/infrastructure/JobGenerator.ts`

**Key Differences:**
- Uses Redis backing store
- TypeScript interfaces (type safety)
- More robust queue management
- Cleanup jobs for orphaned checks

```typescript
// Cleanup job runs every 24 hours
scheduler.addJob({
    id: "cleanup-orphaned-checks",
    template: "cleanup-job",
    repeat: 24 * 60 * 60 * 1000,
    active: true
});
```

### Monitor Execution Flow

```
Monitor Created/Updated
    ↓
MonitorService.createMonitor() 
    ↓
jobQueue.addJob(monitor)
    ↓
Job scheduled at interval
    ↓
[Job Execution]
    ├─ Check maintenance window
    ├─ NetworkService.requestStatus(monitor)
    │   └─ Routes to type handler (requestDocker, requestHttp, etc)
    ├─ Create Check record (database)
    ├─ StatusService.updateMonitorStatus()
    │   └─ Updates Monitor.status field
    ├─ MonitorStatsService.updateStats()
    ├─ If status changed → NotificationService.handleNotifications()
    └─ Job completes / reschedules for next interval
```

### Status Update Logic
**Location:** `/server/src/service/v1/infrastructure/statusService.js`

```javascript
async updateStatus(networkResponse) {
    // networkResponse = { monitorId, type, status, code, message, responseTime }
    
    // 1. Create Check record
    const check = await Check.create({
        monitorId, teamId, type, status, 
        responseTime, statusCode: code, message
    });
    
    // 2. Get previous status
    const prevStatus = monitor.status;
    
    // 3. Apply statusWindow logic (sliding window of checks)
    monitor.statusWindow.push(status);
    if (monitor.statusWindow.length > monitor.statusWindowSize) {
        monitor.statusWindow.shift();
    }
    
    // 4. Determine if DOWN (majority of window is false)
    const downCount = monitor.statusWindow.filter(s => !s).length;
    const isDown = (downCount / monitor.statusWindowSize) > 
                   (monitor.statusWindowThreshold / 100);
    
    monitor.status = isDown ? false : true;
    
    // 5. Return status change info
    return {
        monitor: await monitor.save(),
        statusChanged: prevStatus !== monitor.status,
        prevStatus
    };
}
```

---

## 6. FRONTEND COMPONENTS

### Monitor Management Pages

#### Infrastructure Monitors (Hardware/Docker)
**Location:** `/client/src/Pages/v1/Infrastructure/`

```
Infrastructure/
├── Create/
│   ├── index.jsx (Main form - 10K lines)
│   ├── Components/
│   │   ├── MonitorStatusHeader.jsx
│   │   ├── MonitorActionButtons.jsx
│   │   └── CustomAlertsSection.jsx
│   └── hooks/
│       ├── useInfrastructureMonitorForm.jsx
│       ├── useValidateInfrastructureForm.jsx
│       └── useInfrastructureSubmit.jsx
├── Details/
├── Monitors/
│   └── Components/
│       └── MonitorsTable.jsx
```

#### Form Structure (useInfrastructureMonitorForm hook)
```javascript
const [infrastructureMonitor, setInfrastructureMonitor] = useState({
    url: "",           // Container name/IP
    name: "",          // Display name
    notifications: [], // Notification IDs
    interval: 0.25,    // Minutes (0.25 = 15s, 1 = 60s)
    
    // Threshold toggles
    cpu: false,
    usage_cpu: "",     // Percentage
    memory: false,
    usage_memory: "",
    disk: false,
    usage_disk: "",
    temperature: false,
    usage_temperature: "",
    
    secret: "",        // Capture API secret
    statusWindowSize: 5,
    statusWindowThreshold: 60
});
```

**Frequency Options:**
```javascript
[
    { _id: 0.25, name: "15 Seconds" },
    { _id: 0.5, name: "30 Seconds" },
    { _id: 1, name: "1 Minute" },
    { _id: 2, name: "2 Minutes" },
    { _id: 5, name: "5 Minutes" },
    { _id: 10, name: "10 Minutes" }
]
```

#### Form Submission (useInfrastructureSubmit hook)
```javascript
// Converts frontend form → backend model
const finalForm = {
    url: `http${https ? "s" : ""}://` + infrastructureMonitor.url,
    name: infrastructureMonitor.name || infrastructureMonitor.url,
    interval: infrastructureMonitor.interval * 60000,  // Convert to ms
    type: "hardware",  // Always "hardware" for infrastructure monitors
    
    // Thresholds (convert % to decimal 0-1)
    thresholds: {
        ...(cpu ? { usage_cpu: usage_cpu / 100 } : {}),
        ...(memory ? { usage_memory: usage_memory / 100 } : {}),
        ...(disk ? { usage_disk: usage_disk / 100 } : {}),
        ...(temperature ? { usage_temperature: usage_temperature / 100 } : {})
    },
    
    notifications: infrastructureMonitor.notifications
};

// API call
isCreate ? 
    await createMonitor({ monitor: finalForm, redirect: "/infrastructure" }) :
    await updateMonitor({ monitor: finalForm, redirect: "/infrastructure" });
```

### Monitor Display Components

#### Monitor Status Component
**Location:** `/client/src/Components/v2/Monitors/MonitorStatus.tsx`

Displays:
- Status indicator (up/down)
- Response time
- Last check time
- Incident badges

#### Monitoring Hooks
**Location:** `/client/src/Hooks/v1/monitorHooks.js`

```javascript
// Fetch monitors
useFetchMonitorsByTeamId({ types, limit, page, ... })
useFetchMonitorsWithSummary({ types, monitorUpdateTrigger })
useFetchMonitorsWithChecks({ types, limit, ... })

// Fetch individual monitor
useFetchHardwareMonitorById({ monitorId, updateTrigger })
useFetchStatsByMonitorId({ monitorId, dateRange, ... })

// Manage monitors
useCreateMonitor()      // POST /monitors
useUpdateMonitor()      // PUT /monitors/:id
useDeleteMonitor()      // DELETE /monitors/:id
usePauseMonitor()       // POST /monitors/pause/:id
```

### Network Service (API Client)
**Location:** `/client/src/Utils/NetworkService.js` (1157 lines)

```javascript
// Constructor
constructor(store, dispatch, navigate) {
    // Axios instance with:
    // - Bearer token injection
    // - Language header
    // - 401 redirect to login
    // - Network error handling
}

// Monitor endpoints
async createMonitor(config) {
    return this.axiosInstance.post(`/monitors`, config.monitor);
}

async updateMonitor(config) {
    return this.axiosInstance.put(`/monitors/${config.monitorId}`, config.monitor);
}

async getMonitorsByTeamId(config) {
    // Query params: limit, types[], page, rowsPerPage, filter, field, order
    return this.axiosInstance.get(`/monitors/team?...`);
}

async getHardwareDetailsByMonitorId(config) {
    return this.axiosInstance.get(`/monitors/hardware/details/${config.monitorId}`);
}

async getStatsByMonitorId(config) {
    // Query params: sortOrder, limit, dateRange, numToDisplay, normalize
    return this.axiosInstance.get(`/monitors/stats/${config.monitorId}?...`);
}
```

---

## 7. AUTHENTICATION & API KEYS

### User Authentication (JWT)

**Registration/Login:**
```javascript
// POST /auth/register
{
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "SecurePass123!"
}

Response:
{
    user: { _id, email, role, teamId, ... },
    token: "eyJhbGciOiJIUzI1NiIs..." // JWT
}
```

**Token Storage:** Redux store (`Features/Auth/authSlice`)

**Token Injection:** Automatic by NetworkService
```javascript
config.headers.Authorization = `Bearer ${authToken}`;
```

### Monitor-Specific Authentication

#### For Hardware/Docker Monitors via Capture API
Monitors can have a `secret` field for authenticating requests to the Capture API:

```javascript
{
    type: "hardware",
    url: "http://192.168.1.100:3000",  // Capture endpoint
    secret: "api-key-12345",            // Passed to Capture API
    thresholds: { ... }
}
```

**Implementation:** The secret is stored in the Monitor model and could be:
1. Sent as HTTP header: `Authorization: Bearer <secret>`
2. Sent as query param: `?secret=<secret>`
3. Sent in request body for POST requests

---

## 8. CONFIGURATION & USER SETTINGS

### Global Settings
**Model:** `/server/src/db/v1/models/AppSettings.js`

```javascript
{
    jwtSecret: String,              // For signing JWTs
    sslCertificate: String,         // SSL cert content
    smtpConfig: Object,             // Email settings
    globalThresholds: {             // Default thresholds
        cpu: Number,
        memory: Number,
        disk: Number,
        temperature: Number
    },
    siteTitle: String,
    defaultLanguage: String,
    maintenanceMode: Boolean
}
```

**Fetching Settings:**
```javascript
// Frontend
useFetchGlobalSettings() 
    → NetworkService.getGlobalSettings()
    → GET /settings

// Backend
SettingsService.loadSettings()
    → Loads from AppSettings collection
```

### Monitor Configuration UI Flow

1. **Create Page:** `/infrastructure/create`
   - Fetch global settings for default thresholds
   - Form includes:
     - Monitor name
     - URL/Container name
     - Interval (dropdown)
     - CPU/Memory/Disk/Temp thresholds (checkboxes + inputs)
     - Notification channels (multi-select)
     - Secret (if using Capture API)

2. **Edit Page:** `/infrastructure/configure/:monitorId`
   - Load existing monitor data
   - Update form fields
   - Save changes with PUT request

3. **Details Page:** `/infrastructure/:monitorId`
   - Display monitor stats
   - Show uptime graph
   - List recent checks
   - Status history

### Team-Based Isolation
**Access Control:**
```javascript
// All queries filtered by teamId
await Monitor.find({ teamId: req.user.teamId });

// verifyTeamAccess middleware
await verifyTeamAccess(req.user.teamId, req.params.monitorId);
```

---

## KEY PATTERNS FOR DOCKER MONITORING INTEGRATION

### 1. Adding Docker Monitor Type
Already supported! Located in:
- `Monitor.schema` type enum ✓
- `NetworkService.requestDocker()` ✓
- `Check.schema` with type ✓

### 2. Docker-Specific Data Collection
Currently: Only status + response time
**To Add Detailed Metrics:**
- Extend `Check.schema` with Docker stats fields
- Modify `NetworkService.requestDocker()` to call `container.stats()`
- Stream stats to `Check.docker` field

### 3. Capture API Integration (Hardware Monitoring)
**Flow:**
```
Monitor with type="hardware" and url="http://capture-endpoint"
    ↓
NetworkService.requestHardware()
    ↓ (delegates to)
NetworkService.requestHttp()
    ↓
Expects JSON response: { cpu, memory, disk, net, ... }
    ↓
Check record stores full payload in hardware fields
```

### 4. Database Queries
**Get hardware checks:**
```javascript
Check.find({
    monitorId: id,
    type: "hardware",
    createdAt: { $gte: startDate, $lte: endDate }
})
.sort({ createdAt: -1 })
.limit(100)
```

### 5. UI Display
- Stats dashboard: `/infrastructure/:monitorId`
- Uptime details: `/monitor/uptime/details/:monitorId`
- Hardware details: `/monitor/hardware/details/:monitorId`

---

## SERVICE ARCHITECTURE

### Service Registry Pattern
**Location:** `/server/src/service/v1/system/serviceRegistry.js`

```javascript
// Singleton pattern
ServiceRegistry.set(serviceName, serviceInstance);
const service = ServiceRegistry.get(serviceName);
```

### Service Dependencies
**Initialization:** `/server/src/config/services.js`

```javascript
// Infrastructure services
new NetworkService({
    axios, got, https, jmespath, GameDig, ping,
    logger, http, Docker,  // ← Docker client injected
    net, stringService, settingsService
})

// Business services
new MonitorService({
    db, settingsService, jobQueue, 
    stringService, emailService, logger
})
```

---

## KEY FILES SUMMARY

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Monitor Model | `server/src/db/v1/models/Monitor.js` | 209 | Schema, hooks |
| Check Model | `server/src/db/v1/models/Check.js` | 177 | Check records, TTL |
| NetworkService | `server/src/service/v1/infrastructure/networkService.js` | 580 | Type handlers |
| MonitorService | `server/src/service/v1/business/monitorService.js` | 277 | CRUD, validation |
| MonitorModule | `server/src/db/v1/modules/monitorModule.js` | 593 | DB queries |
| JobQueue | `server/src/service/v1/infrastructure/SuperSimpleQueue/SuperSimpleQueue.js` | 177 | Job scheduling |
| MonitorController | `server/src/controllers/v1/monitorController.js` | 475 | HTTP handlers |
| MonitorRoute | `server/src/routes/v1/monitorRoute.js` | 61 | Endpoint definitions |
| Frontend Hooks | `client/src/Hooks/v1/monitorHooks.js` | 500+ | Data fetching |
| NetworkService (FE) | `client/src/Utils/NetworkService.js` | 1157 | API client |
| Form Hook | `client/src/Pages/v1/Infrastructure/Create/hooks/useInfrastructureMonitorForm.jsx` | 97 | Form state |

---

## DEPLOYMENT & DOCKER INTEGRATION

### Docker-Compose Setup
**Files:** `/docker/dev/docker-compose.yaml`, `/docker/prod/docker-compose.yaml`

**Volumes for Docker Monitoring:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock  # Required for Dockerode
```

### Environment Variables
**Backend (.env):**
```
MONGODB_URI=mongodb://mongo:27017/checkmate
JWT_SECRET=your-secret-key
NODE_ENV=production|development
PORT=5000
```

**Frontend (.env):**
```
VITE_APP_API_BASE_URL=http://localhost:5000/api/v1
```

