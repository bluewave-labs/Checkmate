import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { Mongoose } from "mongoose";
import { ConnectService, DEFAULT_CONNECT_HOSTS, isConnectHostAllowed } from "../../../src/domain/connect/connect.service.ts";
import { ConnectHeartbeat } from "../../../src/domain/connect/connect.heartbeat.ts";
import { validateTunnelRequest } from "../../../src/domain/connect/connect.tunnel.ts";
import { buildDumpArgs, deriveBackupKey, isAllowedTransferUrl } from "../../../src/domain/connect/connect.backup.ts";
import { CONNECT_STATE_COLLECTION, emptyConnectState, type ConnectState } from "../../../src/domain/connect/connect.type.ts";
import type { IConnectRepository } from "../../../src/domain/connect/connect.repository.ts";
import type { IEncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import type { IDb } from "../../../src/db/db.interface.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

const LOCAL = "http://127.0.0.1:52345";
const TOKEN = `cmk_${"a".repeat(48)}`;
const enrollInput = { connectUrl: "wss://relay.checkmate.so/api/tunnel", agentId: "inst-1", token: TOKEN };

const makeEncryption = (configured: boolean) =>
	({
		isConfigured: () => configured,
		encrypt: (value: string) => `v1.key.${value}`,
		decrypt: (value: string) => value.replace("v1.key.", ""),
		needsReencryption: () => false,
	}) as unknown as IEncryptionService;

const setup = (opts: { configured?: boolean; stored?: ConnectState | null; load?: () => Promise<ConnectState | null> } = {}) => {
	const repository: jest.Mocked<IConnectRepository> = {
		load: jest.fn(opts.load ?? (async () => opts.stored ?? null)),
		save: jest.fn(async () => {}),
	};
	const db = { getConnection: async () => ({ connection: { readyState: 1, name: "uptime_db" } }) } as unknown as IDb<Mongoose>;
	const service = new ConnectService({
		repository,
		encryptionService: makeEncryption(opts.configured ?? true),
		db,
		logger: createMockLogger() as unknown as ILogger,
		options: {
			localTarget: LOCAL,
			version: "3.13.1",
			mongoUrl: "mongodb://localhost/uptime_db",
			allowedHosts: DEFAULT_CONNECT_HOSTS,
			apiBaseOverride: null,
			mongodumpBin: "mongodump",
			mongorestoreBin: "mongorestore",
		},
	});
	return { service, repository };
};

describe("Connect", () => {
	const services: ConnectService[] = [];
	afterEach(() => {
		services.splice(0).forEach((service) => service.stop());
		jest.restoreAllMocks();
	});

	describe("isConnectHostAllowed", () => {
		it("accepts the official hosts only", () => {
			expect(isConnectHostAllowed("wss://relay.checkmate.so/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(true);
			expect(isConnectHostAllowed("https://connect.checkmate.so", DEFAULT_CONNECT_HOSTS)).toBe(true);
			expect(isConnectHostAllowed("wss://relay.checkmate.so.evil.com/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
			expect(isConnectHostAllowed("not a url", DEFAULT_CONNECT_HOSTS)).toBe(false);
		});

		it("treats a leading dot as a suffix", () => {
			expect(isConnectHostAllowed("wss://a.example.com/api/tunnel", [".example.com"])).toBe(true);
			expect(isConnectHostAllowed("wss://aexample.com/api/tunnel", [".example.com"])).toBe(false);
		});
	});

	describe("validateTunnelRequest", () => {
		const request = (overrides: Record<string, unknown>) => ({ type: "request", id: "1", method: "GET", path: "/login", ...overrides });

		it("resolves a normal request against the local origin", () => {
			expect(validateTunnelRequest(request({}), LOCAL)?.url.href).toBe(`${LOCAL}/login`);
		});

		it.each(["//evil.com/x", "http://evil.com/x", "login", 42])("rejects path %s", (path) => {
			expect(validateTunnelRequest(request({ path }), LOCAL)).toBeNull();
		});

		it.each(["CONNECT", "TRACE", undefined])("rejects method %s", (method) => {
			expect(validateTunnelRequest(request({ method }), LOCAL)).toBeNull();
		});

		it("drops host and hop-by-hop headers and non-string values", () => {
			const headers = { Host: "evil.com", Connection: "close", Authorization: "Bearer x", "x-number": 1 };
			expect(validateTunnelRequest(request({ headers }), LOCAL)?.headers).toEqual({ authorization: "Bearer x" });
		});
	});

	describe("backup arguments", () => {
		it("never puts the database URI on the command line", () => {
			expect(buildDumpArgs("/tmp/x/mongo.yaml", "uptime_db", "full").join(" ")).not.toContain("mongodb://");
		});

		it.each(["full", "config"] as const)("excludes Connect's own state from %s backups", (kind) => {
			const args = buildDumpArgs("/tmp/x/mongo.yaml", "uptime_db", kind);
			expect(args).toContain(`--excludeCollection=${CONNECT_STATE_COLLECTION}`);
			expect(args).toContain("--db=uptime_db");
		});

		it("excludes operational data from config backups only", () => {
			expect(buildDumpArgs("c", "d", "config")).toContain("--excludeCollection=checks");
			expect(buildDumpArgs("c", "d", "full")).not.toContain("--excludeCollection=checks");
		});

		it("keeps the key derivation of existing CMKB1 backups", () => {
			const key = deriveBackupKey("00".repeat(32), Buffer.alloc(16));
			expect(key.toString("hex")).toBe("8889fac04828176b7e78fee78c1d0bd8aa6fd433913eb1b7f64e8474c55f0a36");
		});
	});

	describe("isAllowedTransferUrl", () => {
		it("accepts Vercel Blob storage over HTTPS", () => {
			expect(isAllowedTransferUrl("https://store1.private.blob.vercel-storage.com/x?sig=1", false)).toBe(true);
		});

		it.each([
			"http://store1.private.blob.vercel-storage.com/x",
			"https://169.254.169.254/latest/meta-data",
			"https://127.0.0.1:52345/api/v1/health",
			"https://blob.vercel-storage.com.evil.com/x",
			"not a url",
		])("rejects %s", (url) => {
			expect(isAllowedTransferUrl(url, false)).toBe(false);
		});

		it("lets an operator using CONNECT_API_URL choose their storage", () => {
			expect(isAllowedTransferUrl("http://127.0.0.1:9000/blob", true)).toBe(true);
			expect(isAllowedTransferUrl("file:///etc/passwd", true)).toBe(false);
		});
	});

	describe("ConnectService", () => {
		it("refuses every change when its state could not be read, so real secrets are not overwritten", async () => {
			const { service, repository } = setup({
				load: async () => {
					throw new Error("decrypt failed");
				},
			});
			services.push(service);
			await service.start();
			expect((await service.createRecoveryKey()).status).toBe(503);
			expect((await service.enroll(enrollInput)).status).toBe(503);
			expect((await service.setRemoteAccess(false)).status).toBe(503);
			expect((await service.unenroll()).status).toBe(503);
			expect((await service.setBackupSchedule({ enabled: false })).status).toBe(503);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("creates one recovery key when two requests race", async () => {
			const { service, repository } = setup();
			const [first, second] = await Promise.all([service.createRecoveryKey(), service.createRecoveryKey()]);
			expect([first.status, second.status].sort()).toEqual([200, 409]);
			expect(repository.save).toHaveBeenCalledTimes(1);
		});

		it("does nothing when the installation was never enrolled", async () => {
			const fetchSpy = jest.spyOn(globalThis, "fetch");
			const { service } = setup();
			services.push(service);
			await service.start();
			expect(service.getStatus().data).toMatchObject({ enrolled: false, remoteAccess: { enabled: false } });
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("stays inactive instead of throwing when its state cannot be loaded", async () => {
			const { service } = setup({
				load: async () => {
					throw new Error("db down");
				},
			});
			services.push(service);
			await expect(service.start()).resolves.toBeUndefined();
			expect(service.getStatus().data).toMatchObject({ enrolled: false });
		});

		it("refuses enrollment against a host that is not allowed, without saving", async () => {
			const { service, repository } = setup();
			const result = await service.enroll({ ...enrollInput, connectUrl: "wss://evil.example/api/tunnel" });
			expect(result.status).toBe(400);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("encrypts the credential at rest and never returns it", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service, repository } = setup();
			services.push(service);
			const result = await service.enroll(enrollInput);
			expect(repository.save.mock.calls[0]![0].enrollment?.token).toBe(`v1.key.${TOKEN}`);
			expect(JSON.stringify(result.data)).not.toContain(TOKEN);
			expect(JSON.stringify(service.getStatus().data)).not.toContain(TOKEN);
		});

		it("stores secrets unencrypted when no ENCRYPTION_KEY is configured", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service, repository } = setup({ configured: false });
			services.push(service);
			await service.enroll(enrollInput);
			expect(repository.save.mock.calls[0]![0].enrollment?.token).toBe(TOKEN);
		});

		it("encrypts existing plaintext secrets once a key is configured", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const stored = { ...emptyConnectState(), enrollment: { ...enrollInput, apiUrl: null } };
			const { service, repository } = setup({ stored });
			services.push(service);
			await service.start();
			expect(repository.save.mock.calls[0]![0].enrollment?.token).toBe(`v1.key.${TOKEN}`);
		});

		it("leaves state unchanged when saving fails", async () => {
			const { service, repository } = setup();
			repository.save.mockRejectedValueOnce(new Error("db down"));
			await expect(service.enroll(enrollInput)).rejects.toThrow("db down");
			expect(service.getStatus().data).toMatchObject({ enrolled: false });
		});

		it("requires enrollment for remote access", async () => {
			const { service } = setup();
			expect((await service.setRemoteAccess(true)).status).toBe(409);
		});

		it("generates the recovery key once", async () => {
			const { service } = setup();
			const first = await service.createRecoveryKey();
			expect(first.data.recoveryKey).toMatch(/^[a-f0-9]{64}$/);
			expect((await service.createRecoveryKey()).status).toBe(409);
		});

		it("keeps the recovery key after unenrolling", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service } = setup();
			services.push(service);
			await service.createRecoveryKey();
			await service.enroll(enrollInput);
			await service.unenroll();
			expect(service.getStatus().data).toMatchObject({ enrolled: false, backup: { recoveryKeySet: true } });
		});

		it("refuses scheduled backups without a recovery key", async () => {
			const { service } = setup();
			expect((await service.setBackupSchedule({ enabled: true })).status).toBe(409);
		});
	});

	describe("ConnectHeartbeat", () => {
		const enrollment = { ...enrollInput, apiUrl: null };
		const makeHeartbeat = (isHealthy: () => Promise<boolean>) =>
			new ConnectHeartbeat({ version: "3.13.1", tunnelConnected: () => true, isHealthy, log: createMockLogger() as unknown as ILogger });

		it("reports to the enrolled host with the Checkmate version", async () => {
			const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const heartbeat = makeHeartbeat(async () => true);
			heartbeat.start(enrollment);
			await heartbeat.beat();
			heartbeat.stop();
			const [url, init] = fetchSpy.mock.calls[0]!;
			expect(String(url)).toBe("https://relay.checkmate.so/api/heartbeat");
			expect(JSON.parse(String(init?.body))).toMatchObject({ agentId: "inst-1", agentVersion: "3.13.1" });
		});

		it("stays silent when the database is unavailable, so the watchdog can alert", async () => {
			const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const heartbeat = makeHeartbeat(async () => false);
			heartbeat.start(enrollment);
			await heartbeat.beat();
			heartbeat.stop();
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("never rejects when the network fails", async () => {
			jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
			const heartbeat = makeHeartbeat(async () => true);
			heartbeat.start(enrollment);
			await expect(heartbeat.beat()).resolves.toBeUndefined();
			heartbeat.stop();
		});
	});
});
