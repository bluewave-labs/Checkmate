import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { ScriptService } from "../../../src/service/business/scriptService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { resetKeyCacheForTests } from "../../../src/utils/scriptCrypto.ts";
import type { IAuditRepository, IProbeRepository, IScriptRepository } from "../../../src/repositories/index.ts";
import type { Script } from "../../../src/types/script.ts";
import type { Monitor } from "../../../src/types/monitor.ts";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const buildScript = (overrides: Partial<Script> = {}): Script => ({
	id: "script-1",
	teamId: "team-1",
	createdBy: "user-1",
	name: "Echo",
	description: "",
	runtime: "bash",
	bodyHash: "",
	encryptedBody: "",
	parameters: {},
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	...overrides,
});

const buildMonitor = (overrides: Partial<Monitor> = {}): Monitor =>
	({
		id: "monitor-1",
		userId: "user-1",
		teamId: "team-1",
		name: "Mon",
		type: "script",
		url: "https://capture.example.com",
		isActive: true,
		interval: 60000,
		statusWindow: [],
		statusWindowSize: 5,
		statusWindowThreshold: 60,
		ignoreTlsErrors: false,
		useAdvancedMatching: false,
		notifications: [],
		tags: [],
		cpuAlertThreshold: 0,
		cpuAlertCounter: 0,
		memoryAlertThreshold: 0,
		memoryAlertCounter: 0,
		diskAlertThreshold: 0,
		diskAlertCounter: 0,
		tempAlertThreshold: 0,
		tempAlertCounter: 0,
		selectedDisks: [],
		group: null,
		recentChecks: [],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		status: "initializing",
		scriptId: "script-1",
		scriptExecutionTarget: "capture",
		scriptExitCodeSuccess: 0,
		scriptMaxExecutionTimeMs: 30000,
		scriptParameterOverrides: {},
		...overrides,
	}) as Monitor;

const createMockScriptRepo = (): jest.Mocked<IScriptRepository> =>
	({
		create: jest.fn(),
		findById: jest.fn(),
		findByTeamId: jest.fn().mockResolvedValue([]),
		update: jest.fn(),
		delete: jest.fn().mockResolvedValue(undefined),
	}) as unknown as jest.Mocked<IScriptRepository>;

const createMockProbeRepo = (): jest.Mocked<IProbeRepository> =>
	({
		register: jest.fn(),
		findById: jest.fn(),
		findByTeamId: jest.fn().mockResolvedValue([]),
		updateLastSeen: jest.fn().mockResolvedValue(undefined),
		deactivate: jest.fn().mockResolvedValue(undefined),
	}) as unknown as jest.Mocked<IProbeRepository>;

const createMockAuditRepo = (): jest.Mocked<IAuditRepository> =>
	({
		log: jest.fn().mockResolvedValue(undefined),
	}) as unknown as jest.Mocked<IAuditRepository>;

const setup = () => {
	const scriptRepository = createMockScriptRepo();
	const probeRepository = createMockProbeRepo();
	const auditRepository = createMockAuditRepo();
	const logger = createMockLogger();
	const httpClient = {
		post: jest.fn(),
	} as unknown as Parameters<typeof ScriptService>[0]["httpClient"];
	const service = new ScriptService({
		scriptRepository,
		probeRepository,
		auditRepository,
		logger: logger as any,
		httpClient,
	});
	return { service, scriptRepository, probeRepository, auditRepository, logger, httpClient };
};

describe("ScriptService", () => {
	let originalKey: string | undefined;

	beforeEach(() => {
		originalKey = process.env.SCRIPT_ENCRYPTION_KEY;
		process.env.SCRIPT_ENCRYPTION_KEY = TEST_KEY;
		resetKeyCacheForTests();
	});

	afterEach(() => {
		if (originalKey === undefined) {
			delete process.env.SCRIPT_ENCRYPTION_KEY;
		} else {
			process.env.SCRIPT_ENCRYPTION_KEY = originalKey;
		}
		resetKeyCacheForTests();
	});

	describe("createScript", () => {
		it("encrypts the body and persists hash + ciphertext", async () => {
			const { service, scriptRepository } = setup();
			scriptRepository.create.mockImplementation(async (input) => buildScript({
				bodyHash: input.bodyHash,
				encryptedBody: input.encryptedBody,
				runtime: input.runtime,
				name: input.name,
				parameters: input.parameters,
			}));

			const plaintext = "echo hello";
			const result = await service.createScript("team-1", "user-1", {
				name: "Echo",
				runtime: "bash",
				body: plaintext,
			});

			expect(scriptRepository.create).toHaveBeenCalledTimes(1);
			const callArg = scriptRepository.create.mock.calls[0]![0];
			expect(callArg.encryptedBody).not.toEqual(plaintext);
			expect(callArg.bodyHash).toMatch(/^[a-f0-9]{64}$/);
			expect(result.bodyHash).toBe(callArg.bodyHash);
		});

		it("writes an audit log entry on success", async () => {
			const { service, scriptRepository, auditRepository } = setup();
			scriptRepository.create.mockResolvedValue(buildScript({ runtime: "bash" }));
			await service.createScript("team-1", "user-1", { name: "Echo", runtime: "bash", body: "echo" });
			// Audit is fire-and-forget; wait for promises to settle.
			await new Promise((r) => setImmediate(r));
			expect(auditRepository.log).toHaveBeenCalledTimes(1);
			const auditArg = auditRepository.log.mock.calls[0]![0];
			expect(auditArg.action).toBe("script.create");
		});
	});

	describe("executeScriptForMonitor", () => {
		it("throws when monitor is not a script type", async () => {
			const { service } = setup();
			const monitor = buildMonitor({ type: "http" as Monitor["type"] });
			await expect(service.executeScriptForMonitor(monitor)).rejects.toThrow(/not a script monitor/);
		});

		it("throws when bodyHash does not match decrypted body (tamper detection)", async () => {
			const { service, scriptRepository } = setup();
			const { encryptScriptBody } = await import("../../../src/utils/scriptCrypto.ts");
			scriptRepository.findById.mockResolvedValue(
				buildScript({
					encryptedBody: encryptScriptBody("real body"),
					bodyHash: "0".repeat(64), // wrong hash
				})
			);
			await expect(service.executeScriptForMonitor(buildMonitor())).rejects.toThrow(/integrity/);
		});

		it("calls the capture endpoint and returns the result", async () => {
			const { service, scriptRepository, httpClient } = setup();
			const { encryptScriptBody, hashScriptBody } = await import("../../../src/utils/scriptCrypto.ts");
			const plaintext = "echo hi";
			scriptRepository.findById.mockResolvedValue(
				buildScript({
					encryptedBody: encryptScriptBody(plaintext),
					bodyHash: hashScriptBody(plaintext),
				})
			);
			(httpClient as any).post = jest.fn().mockResolvedValue({
				body: {
					exit_code: 0,
					stdout: "hi",
					stderr: "",
					execution_time_ms: 12,
					timed_out: false,
				},
			});

			const result = await service.executeScriptForMonitor(buildMonitor());
			expect(result).toMatchObject({
				exitCode: 0,
				stdout: "hi",
				stderr: "",
				executionTimeMs: 12,
				timedOut: false,
			});
			// The post-parse enrichment adds severity, datapoints, and the
			// resolved boolean state so downstream consumers do not have to
			// re-parse stdout themselves.
			expect(result.severity).toBe("success");
			expect(result.statusBoolean).toBe(true);
			expect(result.datapoints).toEqual([]);
		});
	});
});
