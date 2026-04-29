# GlobalPing API Token Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins configure a GlobalPing API token via the Settings UI so distributed geo-checks authenticate against `api.globalping.io` and lift the per-instance quota from 50 measurements/hour (anonymous) to 500/hour (authenticated).

**Architecture:** Store the token as a new `globalpingApiToken` field on the singleton `AppSettings` document — same plaintext-string pattern Checkmate already uses for `pagespeedApiKey` and `systemEmailPassword`. Mask presence on read with a boolean (`globalpingTokenSet`) instead of returning the value, identical to `pagespeedKeySet`. `GlobalPingService` reads the token from `SettingsService` before each request and adds an `Authorization: Bearer <token>` header when present. A new `POST /api/v1/settings/globalping/test` endpoint validates the token by calling `GET https://api.globalping.io/v1/limits` and returns the remaining quota for display in the UI.

**Tech Stack:** Node 20 + Express + TypeScript (server), Mongoose, Zod (server validation), `got` (HTTP), React 18 + MUI + Vite + react-hook-form (client), i18next.

---

## File Structure

**Server — modify:**
- `server/src/types/settings.ts` — add `globalpingApiToken?: string` to `Settings`
- `server/src/db/models/AppSettings.ts` — add `globalpingApiToken` schema field
- `server/src/repositories/settings/MongoSettingsRepository.ts` — map `globalpingApiToken` in `toEntity`
- `server/src/validation/settingsValidation.ts` — accept the field in `updateAppSettingsBodyValidation`
- `server/src/controllers/settingsController.ts` — strip token from response, expose `globalpingTokenSet`, add `testGlobalpingToken` handler
- `server/src/routes/v1/settingsRoute.ts` — register `POST /globalping/test`
- `server/src/service/system/settingsService.ts` — add `getGlobalpingApiToken()` accessor
- `server/src/service/infrastructure/globalPingService.ts` — inject `SettingsService`, read token, send `Authorization` header, add `getQuota()`, redact `Authorization` header from logged errors
- `server/src/config/services.ts` — pass `settingsService` into `GlobalPingService`

**Server — create:**
- `server/test/service/infrastructure/globalPingService.test.ts` — unit tests for header injection + log redaction + quota fetch

**Client — modify:**
- `client/src/Types/Settings.ts` — add `globalpingApiToken?: string` and `globalpingTokenSet: boolean`
- `client/src/Validation/settings.ts` — add field to settings zod schema
- `client/src/Hooks/useSettingsForm.ts` — add `globalpingApiToken: ""` default
- `client/src/Pages/Settings/index.tsx` — add "Distributed monitoring" `ConfigBox` section
- `client/src/locales/en.json` (and remaining 15 locale files via the same key-only English additions) — add translation keys

---

## Task 1: Backend — extend `Settings` type and Mongoose schema

**Files:**
- Modify: `server/src/types/settings.ts`
- Modify: `server/src/db/models/AppSettings.ts`
- Modify: `server/src/repositories/settings/MongoSettingsRepository.ts`

- [ ] **Step 1: Add field to `Settings` interface**

In `server/src/types/settings.ts`, add `globalpingApiToken?: string;` immediately after `pagespeedApiKey?: string;` (line 20):

```ts
export interface Settings {
	id: string;
	checkTTL: number;
	language: string;
	jwtSecret?: string;
	pagespeedApiKey?: string;
	globalpingApiToken?: string;
	systemEmailHost?: string;
	// ...rest unchanged
}
```

- [ ] **Step 2: Add field to Mongoose schema**

In `server/src/db/models/AppSettings.ts`, add the field inside `AppSettingsSchema` immediately after `pagespeedApiKey: { type: String },` (line 25):

```ts
pagespeedApiKey: { type: String },
globalpingApiToken: { type: String },
```

- [ ] **Step 3: Map field in repository `toEntity`**

In `server/src/repositories/settings/MongoSettingsRepository.ts`, add the mapping inside `toEntity` immediately after the `pagespeedApiKey` line (line 27):

```ts
pagespeedApiKey: doc.pagespeedApiKey ?? undefined,
globalpingApiToken: doc.globalpingApiToken ?? undefined,
```

- [ ] **Step 4: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/types/settings.ts server/src/db/models/AppSettings.ts server/src/repositories/settings/MongoSettingsRepository.ts
git commit -m "feat(settings): add globalpingApiToken field to AppSettings"
```

---

## Task 2: Backend — accept field in settings validation

**Files:**
- Modify: `server/src/validation/settingsValidation.ts`

- [ ] **Step 1: Add field to zod schema**

In `server/src/validation/settingsValidation.ts`, add the line inside `updateAppSettingsBodyValidation` immediately after `pagespeedApiKey: z.string().nullable().optional(),` (line 12):

```ts
pagespeedApiKey: z.string().nullable().optional(),
globalpingApiToken: z.string().trim().max(256).nullable().optional(),
```

- [ ] **Step 2: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/validation/settingsValidation.ts
git commit -m "feat(settings): accept globalpingApiToken in update body validation"
```

---

## Task 3: Backend — mask token on read in controller

**Files:**
- Modify: `server/src/controllers/settingsController.ts`

- [ ] **Step 1: Add `globalpingTokenSet` to response and strip the token**

In `server/src/controllers/settingsController.ts`, replace `buildAppSettings` (lines 30–50) with:

```ts
buildAppSettings = (dbSettings: Settings) => {
	const sanitizedSettings: Record<string, unknown> = { ...dbSettings };
	delete sanitizedSettings.version;
	delete sanitizedSettings.jwtSecret;
	const returnSettings: Record<string, unknown | null> = {
		pagespeedKeySet: false,
		emailPasswordSet: false,
		globalpingTokenSet: false,
		settings: null,
	};

	if (typeof sanitizedSettings.pagespeedApiKey !== "undefined") {
		returnSettings.pagespeedKeySet = true;
		delete sanitizedSettings.pagespeedApiKey;
	}
	if (typeof sanitizedSettings.systemEmailPassword !== "undefined") {
		returnSettings.emailPasswordSet = true;
		delete sanitizedSettings.systemEmailPassword;
	}
	if (typeof sanitizedSettings.globalpingApiToken !== "undefined") {
		returnSettings.globalpingTokenSet = true;
		delete sanitizedSettings.globalpingApiToken;
	}
	returnSettings.settings = sanitizedSettings;
	return returnSettings;
};
```

- [ ] **Step 2: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/settingsController.ts
git commit -m "feat(settings): mask globalpingApiToken on read with globalpingTokenSet flag"
```

---

## Task 4: Backend — accessor on `SettingsService`

**Files:**
- Modify: `server/src/service/system/settingsService.ts`

- [ ] **Step 1: Read existing service to confirm interface shape**

Run: `cat server/src/service/system/settingsService.ts | head -80`

You'll see an `ISettingsService` interface and a class with `getDBSettings()`. Add the new method on both, located by reading the file.

- [ ] **Step 2: Add `getGlobalpingApiToken` to interface**

In `server/src/service/system/settingsService.ts`, find the `ISettingsService` interface definition. Add this method signature inside it, immediately after the existing `getDBSettings` declaration:

```ts
getGlobalpingApiToken(): Promise<string | undefined>;
```

- [ ] **Step 3: Implement `getGlobalpingApiToken` in `SettingsService` class**

In the same file, add this method to the `SettingsService` class (placement: after the existing `getDBSettings` method):

```ts
getGlobalpingApiToken = async (): Promise<string | undefined> => {
	const settings = await this.getDBSettings();
	const token = settings?.globalpingApiToken?.trim();
	return token && token.length > 0 ? token : undefined;
};
```

- [ ] **Step 4: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/service/system/settingsService.ts
git commit -m "feat(settings): add getGlobalpingApiToken accessor on SettingsService"
```

---

## Task 5: Backend — `GlobalPingService` reads token and adds `Authorization` header

**Files:**
- Modify: `server/src/service/infrastructure/globalPingService.ts`

- [ ] **Step 1: Update interface and constructor to accept `SettingsService`**

In `server/src/service/infrastructure/globalPingService.ts`, replace the top of the file (lines 1–10) with:

```ts
import type { GeoContinent, GeoCheckResult, GeoCheckTimings, GeoCheckLocation } from "@/types/geoCheck.js";
import { supportsGeoCheck } from "@/types/monitor.js";
import { MonitorType } from "@/types/index.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/service/system/settingsService.js";
import got from "got";

const SERVICE_NAME = "GlobalPingService";
const GLOBAL_PING_API_BASE = "https://api.globalping.io/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_TIMEOUT_MS = 30000;
```

Then replace the `IGlobalPingService` interface and the class constructor (lines 62–80) with:

```ts
export interface GlobalPingQuota {
	authenticated: boolean;
	remaining: number;
	limit: number;
}

export interface IGlobalPingService {
	readonly serviceName: string;
	createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null>;
	pollForResults(measurementId: string, timeoutMs?: number): Promise<GeoCheckResult[]>;
	getQuota(tokenOverride?: string): Promise<GlobalPingQuota>;
}

export class GlobalPingService implements IGlobalPingService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private settingsService: ISettingsService;

	constructor(logger: ILogger, settingsService: ISettingsService) {
		this.logger = logger;
		this.settingsService = settingsService;
	}

	get serviceName() {
		return GlobalPingService.SERVICE_NAME;
	}

	private async authHeaders(tokenOverride?: string): Promise<Record<string, string>> {
		const token = tokenOverride ?? (await this.settingsService.getGlobalpingApiToken());
		return token ? { Authorization: `Bearer ${token}` } : {};
	}
```

- [ ] **Step 2: Use the auth header in `createMeasurement`**

Replace the body of `createMeasurement` (lines 81–120) with:

```ts
async createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null> {
	try {
		if (!supportsGeoCheck(monitorType)) {
			throw new Error(`Unsupported monitor type for GlobalPing: ${monitorType}`);
		}
		const cleanTarget = url.replace(/^https?:\/\//, "");

		const requestBody: GlobalPingMeasurementRequest = {
			type: monitorType,
			target: cleanTarget,
			locations: locations.map((continent) => ({ continent })),
			limit: locations.length,
		};

		const headers = await this.authHeaders();

		const response = await got.post<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements`, {
			json: requestBody,
			headers,
			responseType: "json",
			timeout: { request: 10000 },
		});

		const measurementId = response.body.id;

		this.logger.debug({
			message: `Created GlobalPing measurement: ${measurementId} for target: ${cleanTarget}`,
			service: SERVICE_NAME,
			method: "createMeasurement",
		});

		return measurementId;
	} catch (error: unknown) {
		this.logger.error({
			message: "GlobalPing API unavailable, skipping geo check",
			service: SERVICE_NAME,
			method: "createMeasurement",
			details: { error: this.redactErrorMessage(error) },
		});
		return null;
	}
}
```

- [ ] **Step 3: Use the auth header in `pollForResults` and redact stack**

Replace `pollForResults` (lines 122–175) with:

```ts
async pollForResults(measurementId: string, timeoutMs: number = MAX_POLL_TIMEOUT_MS): Promise<GeoCheckResult[]> {
	const startTime = Date.now();
	const headers = await this.authHeaders();

	while (Date.now() - startTime < timeoutMs) {
		try {
			const response = await got.get<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements/${measurementId}`, {
				headers,
				responseType: "json",
				timeout: { request: 5000 },
			});

			const measurement = response.body;

			if (measurement.status === "finished") {
				const results = this.transformResults(measurement.results || []);
				this.logger.debug({
					message: `GlobalPing measurement completed: ${measurementId}`,
					service: SERVICE_NAME,
					method: "pollForResults",
					details: { measurementId, resultsCount: results.length },
				});
				return results;
			}

			if (measurement.status === "failed") {
				this.logger.warn({
					message: `GlobalPing measurement failed: ${measurementId}`,
					service: SERVICE_NAME,
					method: "pollForResults",
				});
				return [];
			}

			await this.sleep(POLL_INTERVAL_MS);
		} catch (error: unknown) {
			this.logger.error({
				message: "Error polling GlobalPing API",
				service: SERVICE_NAME,
				method: "pollForResults",
				details: { error: this.redactErrorMessage(error) },
			});
			return [];
		}
	}

	this.logger.warn({
		message: `GlobalPing measurement polling timeout: ${measurementId}`,
		service: SERVICE_NAME,
		method: "pollForResults",
		details: { measurementId, timeoutMs },
	});
	return [];
}
```

- [ ] **Step 4: Add `getQuota` and `redactErrorMessage`**

Add these two methods to the class (placement: after `pollForResults`, before `transformResults`):

```ts
async getQuota(tokenOverride?: string): Promise<GlobalPingQuota> {
	const headers = await this.authHeaders(tokenOverride);
	const response = await got.get<{ rateLimit?: { measurements?: { create?: { limit?: number; remaining?: number } } } }>(
		`${GLOBAL_PING_API_BASE}/limits`,
		{
			headers,
			responseType: "json",
			timeout: { request: 5000 },
		}
	);

	const create = response.body.rateLimit?.measurements?.create;
	const limit = create?.limit ?? 0;
	const remaining = create?.remaining ?? 0;
	return {
		authenticated: Object.keys(headers).length > 0,
		limit,
		remaining,
	};
}

private redactErrorMessage(error: unknown): string {
	if (!(error instanceof Error)) return "Unknown error";
	return error.message.replace(/Bearer\s+[^\s"']+/gi, "Bearer ***REDACTED***");
}
```

- [ ] **Step 5: Wire `settingsService` into the service factory**

In `server/src/config/services.ts`, replace line 249:

```ts
const globalPingService = new GlobalPingService(logger);
```

with:

```ts
const globalPingService = new GlobalPingService(logger, settingsService);
```

- [ ] **Step 6: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/service/infrastructure/globalPingService.ts server/src/config/services.ts
git commit -m "feat(globalping): authenticate requests with Bearer token from settings"
```

---

## Task 6: Backend — controller + route for `POST /settings/globalping/test`

**Files:**
- Modify: `server/src/controllers/settingsController.ts`
- Modify: `server/src/routes/v1/settingsRoute.ts`

- [ ] **Step 1: Inject `GlobalPingService` into `SettingsController`**

In `server/src/controllers/settingsController.ts`, replace the imports block (line 5) with:

```ts
import { IEmailService, ISettingsService } from "@/service/index.js";
import { IGlobalPingService } from "@/service/infrastructure/globalPingService.js";
```

Replace the constructor and class fields (lines 17–24):

```ts
class SettingsController implements ISettingsController {
	static SERVICE_NAME = SERVICE_NAME;
	private settingsService: ISettingsService;
	private emailService: IEmailService;
	private globalPingService: IGlobalPingService;
	constructor(settingsService: ISettingsService, emailService: IEmailService, globalPingService: IGlobalPingService) {
		this.settingsService = settingsService;
		this.emailService = emailService;
		this.globalPingService = globalPingService;
	}
```

- [ ] **Step 2: Add the handler and interface entry**

In the same file, add to `ISettingsController` (line 10) immediately after `sendTestEmail`:

```ts
testGlobalpingToken(req: Request, res: Response, next: NextFunction): Promise<Response | void>;
```

Add this handler at the bottom of the class, before the closing brace:

```ts
testGlobalpingToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const tokenInput = typeof req.body?.token === "string" ? req.body.token.trim() : undefined;
		const tokenOverride = tokenInput && tokenInput.length > 0 ? tokenInput : undefined;
		const quota = await this.globalPingService.getQuota(tokenOverride);
		return res.status(200).json({
			success: true,
			msg: "GlobalPing connection verified",
			data: quota,
		});
	} catch (error) {
		if (error && typeof error === "object" && "response" in error) {
			const statusCode = (error as { response?: { statusCode?: number } }).response?.statusCode;
			if (statusCode === 401 || statusCode === 403) {
				return res.status(200).json({
					success: false,
					msg: "Invalid GlobalPing token",
					data: null,
				});
			}
		}
		next(error);
	}
};
```

- [ ] **Step 3: Update `SettingsController` factory site**

Run: `grep -rn "new SettingsController" server/src --include="*.ts"`

For each match, add `globalPingService` as the third argument. Expect one match in `server/src/config/services.ts`. Replace that line with:

```ts
const settingsController = new SettingsController(settingsService, emailService, globalPingService);
```

(Reorder service creation in `services.ts` if necessary so `globalPingService` is created before `settingsController`.)

- [ ] **Step 4: Register the route**

Run: `cat server/src/routes/v1/settingsRoute.ts`

Add a new POST route immediately after the existing `sendTestEmail` route registration. Pattern match the existing route style. Example addition:

```ts
router.post("/globalping/test", settingsController.testGlobalpingToken);
```

- [ ] **Step 5: Build server**

Run: `cd server && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/settingsController.ts server/src/routes/v1/settingsRoute.ts server/src/config/services.ts
git commit -m "feat(settings): POST /settings/globalping/test endpoint to verify token"
```

---

## Task 7: Backend — unit tests for `GlobalPingService`

**Files:**
- Create: `server/test/service/infrastructure/globalPingService.test.ts`

- [ ] **Step 1: Inspect an existing test to match style**

Run: `ls server/test/service/infrastructure/ 2>/dev/null && cat $(ls server/test/service/**/*.test.ts | head -1) | head -60`

Use the same import paths, mocking style, and `describe/it` structure for consistency.

- [ ] **Step 2: Write failing tests**

Create `server/test/service/infrastructure/globalPingService.test.ts` with three tests:

```ts
import { jest } from "@jest/globals";
import { GlobalPingService } from "@/service/infrastructure/globalPingService.js";
import type { ISettingsService } from "@/service/system/settingsService.js";
import type { ILogger } from "@/utils/logger.js";

jest.mock("got");
import got from "got";

describe("GlobalPingService", () => {
	const logger: ILogger = {
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
		debug: jest.fn(),
	} as unknown as ILogger;

	const makeSettings = (token?: string): ISettingsService =>
		({
			getGlobalpingApiToken: jest.fn().mockResolvedValue(token),
		}) as unknown as ISettingsService;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("sends Authorization header when token is configured", async () => {
		const settings = makeSettings("test-token");
		const service = new GlobalPingService(logger, settings);
		(got.post as jest.Mock).mockResolvedValue({ body: { id: "abc", status: "in-progress", probesCount: 1 } });

		await service.createMeasurement("http", "https://example.com", ["EU"]);

		expect(got.post).toHaveBeenCalledWith(
			expect.stringContaining("/measurements"),
			expect.objectContaining({
				headers: { Authorization: "Bearer test-token" },
			})
		);
	});

	it("omits Authorization header when no token is configured", async () => {
		const settings = makeSettings(undefined);
		const service = new GlobalPingService(logger, settings);
		(got.post as jest.Mock).mockResolvedValue({ body: { id: "abc", status: "in-progress", probesCount: 1 } });

		await service.createMeasurement("http", "https://example.com", ["EU"]);

		const call = (got.post as jest.Mock).mock.calls[0][1] as { headers: Record<string, string> };
		expect(call.headers.Authorization).toBeUndefined();
	});

	it("redacts Bearer tokens from logged error messages", async () => {
		const settings = makeSettings("secret");
		const service = new GlobalPingService(logger, settings);
		(got.post as jest.Mock).mockRejectedValue(new Error("Request failed: Authorization: Bearer secret"));

		await service.createMeasurement("http", "https://example.com", ["EU"]);

		const errorCall = (logger.error as jest.Mock).mock.calls.find((args) => (args[0] as { method?: string }).method === "createMeasurement");
		expect(errorCall).toBeDefined();
		const detailsError = (errorCall![0] as { details: { error: string } }).details.error;
		expect(detailsError).not.toContain("secret");
		expect(detailsError).toContain("***REDACTED***");
	});
});
```

- [ ] **Step 3: Run tests**

Run: `cd server && npm test -- globalPingService.test.ts`
Expected: all three tests pass.

- [ ] **Step 4: Commit**

```bash
git add server/test/service/infrastructure/globalPingService.test.ts
git commit -m "test(globalping): cover token header injection and log redaction"
```

---

## Task 8: Frontend — extend types and validation

**Files:**
- Modify: `client/src/Types/Settings.ts`
- Modify: `client/src/Validation/settings.ts`
- Modify: `client/src/Hooks/useSettingsForm.ts`

- [ ] **Step 1: Add fields to client `Settings` type**

In `client/src/Types/Settings.ts`, add `globalpingApiToken?: string;` next to `pagespeedApiKey` and `globalpingTokenSet: boolean;` next to `pagespeedKeySet: boolean;` (line 32). Read the file first to find exact locations.

```ts
pagespeedApiKey?: string;
globalpingApiToken?: string;
// ...
pagespeedKeySet: boolean;
globalpingTokenSet: boolean;
```

- [ ] **Step 2: Add field to client zod validation**

In `client/src/Validation/settings.ts`, add this entry alongside `pagespeedApiKey` (line 20):

```ts
globalpingApiToken: z.string().trim().max(256).optional(),
```

- [ ] **Step 3: Add default to form hook**

In `client/src/Hooks/useSettingsForm.ts`, add `globalpingApiToken: "",` immediately after `pagespeedApiKey: "",` (line 44):

```ts
pagespeedApiKey: "",
globalpingApiToken: "",
```

- [ ] **Step 4: Build client**

Run: `cd client && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/Types/Settings.ts client/src/Validation/settings.ts client/src/Hooks/useSettingsForm.ts
git commit -m "feat(client): wire globalpingApiToken into settings types and form"
```

---

## Task 9: Frontend — Settings page section

**Files:**
- Modify: `client/src/Pages/Settings/index.tsx`

- [ ] **Step 1: Read the existing PageSpeed `ConfigBox` to copy its structure**

Run: `grep -n "pagespeedApiKey\|pagespeedKeySet\|isApiKeySet" client/src/Pages/Settings/index.tsx`

Locate the PageSpeed `ConfigBox` block (around the PageSpeed-related JSX). Copy its visual structure for the new section: title, description, masked input with reset button, save handler.

- [ ] **Step 2: Add component state for token, mask, quota**

Add these state hooks alongside `isApiKeySet` / `apiKeyHasBeenReset`:

```tsx
const [isGlobalpingTokenSet, setIsGlobalpingTokenSet] = useState<boolean>(
	fetchedSettings?.globalpingTokenSet ?? false
);
const [globalpingTokenHasBeenReset, setGlobalpingTokenHasBeenReset] = useState<boolean>(false);
const [globalpingQuota, setGlobalpingQuota] = useState<{ authenticated: boolean; remaining: number; limit: number } | null>(null);
const [globalpingTestStatus, setGlobalpingTestStatus] = useState<"idle" | "loading" | "ok" | "invalid">("idle");
```

- [ ] **Step 3: Hydrate state from fetched settings**

In the existing `useEffect` that reads `fetchedSettings`, alongside `setIsApiKeySet(fetchedSettings.pagespeedKeySet)`, add:

```tsx
setIsGlobalpingTokenSet(fetchedSettings.globalpingTokenSet);
```

- [ ] **Step 4: Strip token from submit when unchanged**

In `onSubmit`, alongside the existing `pagespeedApiKey` strip, add:

```tsx
if (isGlobalpingTokenSet && !globalpingTokenHasBeenReset) {
	delete (dataToSend as any).globalpingApiToken;
}
```

And alongside `setIsApiKeySet(result.data.pagespeedKeySet)`, add:

```tsx
setIsGlobalpingTokenSet(result.data.globalpingTokenSet);
setGlobalpingTokenHasBeenReset(false);
```

- [ ] **Step 5: Add reset handler**

Alongside the existing `handleResetApiKey`, add:

```tsx
const handleResetGlobalpingToken = () => {
	form.setValue("globalpingApiToken", "");
	setGlobalpingTokenHasBeenReset(true);
	setIsGlobalpingTokenSet(false);
	setGlobalpingQuota(null);
	setGlobalpingTestStatus("idle");
};
```

- [ ] **Step 6: Add test-connection handler**

Add alongside other handlers:

```tsx
const handleTestGlobalpingToken = async () => {
	setGlobalpingTestStatus("loading");
	const tokenValue = form.getValues("globalpingApiToken");
	const result = await post("/settings/globalping/test", { token: tokenValue || undefined });
	if (result?.success && result.data) {
		setGlobalpingQuota(result.data);
		setGlobalpingTestStatus("ok");
	} else {
		setGlobalpingQuota(null);
		setGlobalpingTestStatus("invalid");
	}
};
```

(`post` is the same client used by other settings calls — locate the import at the top of the file alongside `patch`.)

- [ ] **Step 7: Render the `ConfigBox` section**

Inside the `<Stack>` of `ConfigBox` siblings, immediately after the PageSpeed `ConfigBox`, add:

```tsx
<ConfigBox>
	<Stack>
		<Typography component="h2" variant="h2">
			{t("settings.distributedMonitoring.title")}
		</Typography>
		<Typography color={theme.palette.text.secondary} variant="body2">
			{t("settings.distributedMonitoring.description")}
		</Typography>
		<Link
			href="https://globalping.io/dashboard"
			target="_blank"
			rel="noopener noreferrer"
			color={theme.palette.primary.main}
		>
			{t("settings.distributedMonitoring.getTokenLink")}
		</Link>
	</Stack>
	<Stack gap={theme.spacing(LAYOUT.MD)}>
		<TextInput
			type="password"
			id="globalping-api-token"
			name="globalpingApiToken"
			label={t("settings.distributedMonitoring.tokenLabel")}
			placeholder={isGlobalpingTokenSet ? t("settings.distributedMonitoring.tokenMasked") : ""}
			disabled={isGlobalpingTokenSet && !globalpingTokenHasBeenReset}
			{...form.register("globalpingApiToken")}
		/>
		<Stack direction="row" gap={theme.spacing(LAYOUT.SM)}>
			{isGlobalpingTokenSet && !globalpingTokenHasBeenReset ? (
				<Button variant="outlined" onClick={handleResetGlobalpingToken}>
					{t("settings.distributedMonitoring.reset")}
				</Button>
			) : null}
			<Button
				variant="outlined"
				onClick={handleTestGlobalpingToken}
				disabled={globalpingTestStatus === "loading"}
			>
				{globalpingTestStatus === "loading"
					? t("settings.distributedMonitoring.testing")
					: t("settings.distributedMonitoring.testConnection")}
			</Button>
		</Stack>
		{globalpingTestStatus === "ok" && globalpingQuota ? (
			<Typography color={theme.palette.success.main} variant="body2">
				{globalpingQuota.authenticated
					? t("settings.distributedMonitoring.authenticatedQuota", {
							remaining: globalpingQuota.remaining,
							limit: globalpingQuota.limit,
						})
					: t("settings.distributedMonitoring.anonymousQuota", {
							remaining: globalpingQuota.remaining,
							limit: globalpingQuota.limit,
						})}
			</Typography>
		) : null}
		{globalpingTestStatus === "invalid" ? (
			<Typography color={theme.palette.error.main} variant="body2">
				{t("settings.distributedMonitoring.invalidToken")}
			</Typography>
		) : null}
	</Stack>
</ConfigBox>
```

(Confirm `Link`, `Button`, `TextInput`, `ConfigBox`, `Stack`, `Typography`, `LAYOUT` are already imported in this file. Add any missing imports following the existing import block style.)

Frontend rules to honor (per `docs/frontend-conventions.md` and `CLAUDE.md`):
- Use MUI native props (`gap`, `direction`, `color`) instead of `sx`.
- Use full theme paths (`theme.palette.text.secondary`, not `"text.secondary"`).
- No hardcoded literals — use `LAYOUT.*` and `theme.*`.
- All user-facing strings via `t()`.
- Use `useTheme()` (already in scope in this file).

- [ ] **Step 8: Build client**

Run: `cd client && npm run build`
Expected: completes with no TypeScript errors and no ESLint warnings.

- [ ] **Step 9: Format check**

Run: `cd client && npm run format-check`
If it reports issues, run `cd client && npm run format`.

- [ ] **Step 10: Commit**

```bash
git add client/src/Pages/Settings/index.tsx
git commit -m "feat(settings): GlobalPing API token section with test connection and quota"
```

---

## Task 10: Translations — add keys

**Files:**
- Modify: `client/src/locales/en.json`
- Modify: 15 other locale files (`ar.json`, `cs.json`, `de.json`, `es.json`, `fi.json`, `fr.json`, `ja.json`, `pt-BR.json`, `ru.json`, `th.json`, `tr.json`, `uk.json`, `vi.json`, `zh-CN.json`, `zh-TW.json`)

- [ ] **Step 1: Add English keys**

Run: `grep -n "settings" client/src/locales/en.json | head -10` to find the `settings` namespace structure.

Add a new sub-object `distributedMonitoring` inside the `settings` namespace (placement: alongside `pagespeed` or similar existing sub-objects):

```json
"distributedMonitoring": {
	"title": "Distributed monitoring",
	"description": "Configure a GlobalPing API token to lift the per-instance quota from 50 to 500 measurements per hour.",
	"getTokenLink": "Get an API token at globalping.io",
	"tokenLabel": "API token",
	"tokenMasked": "Saved",
	"reset": "Reset",
	"testConnection": "Test connection",
	"testing": "Testing…",
	"authenticatedQuota": "Authenticated · {{remaining}} / {{limit}} measurements remaining this hour",
	"anonymousQuota": "Anonymous · {{remaining}} / {{limit}} measurements remaining this hour",
	"invalidToken": "Could not verify the token. Check the value and try again."
}
```

- [ ] **Step 2: Mirror keys into the 15 other locale files (English copy)**

For each of the 15 other locale files, add the same `distributedMonitoring` block with English values. Translation team will localize via the existing PoEditor flow on a follow-up.

```bash
for f in ar cs de es fi fr ja pt-BR ru th tr uk vi zh-CN zh-TW; do
  echo "Patching client/src/locales/$f.json"
done
```

(Edit each file by inserting the same `distributedMonitoring` object inside the `settings` namespace, matching the existing JSON structure of that file.)

- [ ] **Step 3: Build client**

Run: `cd client && npm run build`
Expected: completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/locales/
git commit -m "chore(i18n): add distributed monitoring translation keys (en, fallbacks for 15 locales)"
```

---

## Task 11: Manual end-to-end verification

**Files:**
- None modified.

- [ ] **Step 1: Start the stack**

Run (in separate terminals):
```bash
cd server && npm run dev
cd client && npm run dev -- --port 10001 --strictPort
```

- [ ] **Step 2: Save and read back the token**

1. Open `http://localhost:10001/settings`.
2. In the **Distributed monitoring** section, paste a real GlobalPing token (or any non-empty string).
3. Click Save. Confirm: page reloads, token field becomes disabled with "Saved" placeholder, and the Reset button appears.
4. Verify in MongoDB the token was persisted: `mongosh uptime_db --eval "db.appsettings.findOne({}, { globalpingApiToken: 1 })"`. Expected: the field exists.

- [ ] **Step 3: Verify masking**

Reload the page; observe the token input remains masked (no plaintext leaks via DevTools "Network" → `/api/v1/settings` response).
Expected: response contains `"globalpingTokenSet": true` and **no** `globalpingApiToken` field.

- [ ] **Step 4: Test connection — invalid token**

1. Click Reset.
2. Enter `not-a-real-token`.
3. Click Test connection.
Expected: red "Could not verify the token. Check the value and try again."

- [ ] **Step 5: Test connection — anonymous**

1. Click Reset, leave the field empty.
2. Click Test connection.
Expected: green text showing the anonymous quota (e.g. "Anonymous · 50 / 50 measurements remaining this hour").

- [ ] **Step 6: Test connection — authenticated (if a real token is available)**

1. Paste a real token from globalping.io/dashboard.
2. Click Test connection.
Expected: green text showing 500/hr authenticated quota.

- [ ] **Step 7: Verify outbound auth header**

While a real token is saved, trigger a geo-check on a monitor (enable `geoCheckEnabled` and wait one cycle). In server logs, confirm `createMeasurement` succeeds. In a network capture (or by adding a one-line `console.log` temporarily), confirm the outgoing request to `api.globalping.io/v1/measurements` includes `Authorization: Bearer <token>`. Remove the temporary log before committing.

- [ ] **Step 8: Verify log redaction**

Force a 401 by saving a bad token, then trigger a geo-check (e.g. by toggling `isActive` off/on). Inspect server logs.
Expected: no Bearer token value appears in any logged error message — only `***REDACTED***`.

---

## Self-Review Checklist (already run)

- **Spec coverage:** All four pieces from the spec are covered — settings storage (T1–T3), service consumption (T4–T5), test endpoint (T6), UI (T8–T10), with backend tests (T7) and manual e2e (T11).
- **Placeholder scan:** No "TBD", no "implement later". Each code step shows the full code to write.
- **Type consistency:** Field name `globalpingApiToken` and flag name `globalpingTokenSet` are used identically across server type (T1), zod (T2), controller (T3), service accessor (T4), service constructor (T5), controller endpoint (T6), client type (T8), form hook (T8), and UI (T9). Method `getQuota(tokenOverride?: string)` declared in T5 matches its call in T6 and the test in T7.
- **Convention alignment:** Plaintext-string + masked-flag pattern matches `pagespeedApiKey`/`pagespeedKeySet` exactly. No new encryption layer introduced (Checkmate doesn't have one). No env var path (UI-only, per user instruction). Frontend rules (MUI props, theme paths, `t()`, `useTheme()`) are called out in T9. Build + format-check are explicit per `CLAUDE.md`.
- **Branching:** Plan assumes work happens on a `feat/globalping-api-token` branch off `develop`. PR opens to `develop`. Per `CLAUDE.md`, PR creation is **not** part of this plan and requires explicit user approval.
