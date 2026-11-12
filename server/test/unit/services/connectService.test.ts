import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectService, isConnectHostAllowed } from "../../../src/domain/connect/connect.service.ts";
import { connectErrors } from "../../../src/domain/connect/connect.errors.ts";
import { DEFAULT_CONNECT_HOSTS, type ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import type { ISettingsService } from "../../../src/domain/app-settings/app-settings.service.ts";
import type { IConnectTunnel } from "../../../src/domain/connect/connect-tunnel.ts";
import { APP_VERSION } from "../../../src/utils/appVersion.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { AppError } from "../../../src/utils/AppError.ts";
import type { ILogger } from "../../../src/utils/logger/logger.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";
import type { IConnectApiService } from "../../../src/domain/connect/connect-api.service.ts";
import type { IQueueWorkersRepository } from "../../../src/domain/queue-workers/queue-worker.repository.interface.ts";
import type { QueueWorker } from "../../../src/domain/queue-workers/queue-worker.type.ts";
import type { ConnectApiBackup } from "../../../src/domain/connect/connect-backup.type.ts";
import { recoveryKeyId } from "../../../src/domain/connect/connect.backup-format.ts";

const enrollment = (overrides: Partial<ConnectEnrollment> = {}): ConnectEnrollment => ({
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "agent-1",
	token: `cmk_${"a".repeat(48)}`,
	apiUrl: "https://connect.checkmate.so",
	...overrides,
});

const TUNNEL_STATUS = { connected: false, lastConnectedAt: null, lastError: null, closeCode: null };

const setup = (
	opts: {
		encryptionKey?: boolean;
		allowedHosts?: readonly string[];
		backups?: ConnectApiBackup[];
		listError?: Error;
		running?: boolean;
		workers?: QueueWorker[];
	} = {}
) => {
	const logger = createMockLogger();
	const keys = opts.encryptionKey === false ? [] : [nodeCrypto.randomBytes(32)];
	const encryptionService = new EncryptionService(keys, logger as unknown as ILogger, nodeCrypto);
	const repository = new InMemoryConnectRepository();
	const settingsService = {
		getSettings: () => ({ connectAllowedHosts: [...(opts.allowedHosts ?? DEFAULT_CONNECT_HOSTS)] }),
	} as unknown as ISettingsService;
	const tunnel = { start: jest.fn(), stop: jest.fn(), status: jest.fn(() => ({ ...TUNNEL_STATUS })) };
	const connectApiService = {
		list: jest.fn(async (): Promise<ConnectApiBackup[]> => {
			if (opts.listError) throw opts.listError;
			return opts.backups ?? [];
		}),
	};
	const queueWorkersRepository = { findRecent: jest.fn(async () => opts.workers ?? []) };
	const scheduler = {
		addGlobalJob: jest.fn(async () => undefined),
		isGlobalJobRunning: jest.fn(async () => opts.running ?? false),
	};
	const service = new ConnectService(
		repository,
		encryptionService,
		settingsService,
		tunnel as unknown as IConnectTunnel,
		connectApiService as unknown as IConnectApiService,
		queueWorkersRepository as unknown as IQueueWorkersRepository,
		scheduler,
		logger as unknown as ILogger
	);
	return { service, repository, encryptionService, tunnel, logger, connectApiService, queueWorkersRepository, scheduler };
};

const expectAppError = async (promise: Promise<unknown>, definition: { status: number; description: string }) => {
	const error = await promise.catch((caught: unknown) => caught);
	expect(error).toBeInstanceOf(AppError);
	expect((error as AppError).definition).toBe(definition);
};

const RECOVERY_KEY = "ab".repeat(32);

const enrollStored = async (ctx: ReturnType<typeof setup>, opts: { recoveryKey?: string } = {}) => {
	await ctx.repository.setEnrollment({
		...enrollment(),
		token: ctx.encryptionService.encrypt(enrollment().token),
	});
	if (opts.recoveryKey) await ctx.repository.setRecoveryKeyIfUnset(ctx.encryptionService.encrypt(opts.recoveryKey));
};

const cloudBackup = (overrides: Partial<ConnectApiBackup> = {}): ConnectApiBackup => ({
	id: "b-1",
	kind: "full",
	sizeBytes: 1024,
	status: "verified",
	createdAt: "2026-11-11T10:00:00.000Z",
	...overrides,
});

const liveWorker = (overrides: Partial<QueueWorker> = {}): QueueWorker => ({
	workerId: "w1",
	mode: "worker",
	processesJobs: true,
	lastSeenAt: Date.now(),
	...overrides,
});

describe("isConnectHostAllowed", () => {
	it("accepts the official hosts", () => {
		expect(isConnectHostAllowed("wss://relay.checkmate.so/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(true);
		expect(isConnectHostAllowed("https://connect.checkmate.so", DEFAULT_CONNECT_HOSTS)).toBe(true);
	});

	it("rejects other hosts and lookalikes", () => {
		expect(isConnectHostAllowed("wss://evil.example/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
		expect(isConnectHostAllowed("wss://relay.checkmate.so.evil.com/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
		expect(isConnectHostAllowed("wss://evilrelay.checkmate.so/api/tunnel", DEFAULT_CONNECT_HOSTS)).toBe(false);
	});

	it("matches subdomains only for an entry starting with a dot", () => {
		const allowed = [".example.com"];
		expect(isConnectHostAllowed("https://a.example.com", allowed)).toBe(true);
		expect(isConnectHostAllowed("https://example.com", allowed)).toBe(false);
		expect(isConnectHostAllowed("https://badexample.com", allowed)).toBe(false);
	});

	it("rejects a URL that can't be parsed", () => {
		expect(isConnectHostAllowed("not a url", DEFAULT_CONNECT_HOSTS)).toBe(false);
	});
});

describe("ConnectService.getStatus", () => {
	it("reports not enrolled when the installation never enrolled", async () => {
		const { service } = setup();

		await expect(service.getStatus()).resolves.toEqual({
			enrolled: false,
			agentId: null,
			connectUrl: null,
			apiUrl: null,
			agentVersion: APP_VERSION,
			remoteAccess: { enabled: false },
			tunnel: TUNNEL_STATUS,
			backup: { recoveryKeySet: false },
		});
	});

	it("includes the tunnel's own status", async () => {
		const { service, tunnel } = setup();
		const live = { connected: true, lastConnectedAt: "2026-11-10T16:00:00.000Z", lastError: null, closeCode: null };
		tunnel.status.mockReturnValue(live);

		await expect(service.getStatus()).resolves.toMatchObject({ tunnel: live });
	});
});

describe("ConnectService.enroll", () => {
	it("stores the enrollment with the token encrypted and returns the status without it", async () => {
		const { service, repository, encryptionService } = setup();
		const input = enrollment();

		const status = await service.enroll(input);

		expect(status).toEqual({
			enrolled: true,
			agentId: input.agentId,
			connectUrl: input.connectUrl,
			apiUrl: input.apiUrl,
			agentVersion: APP_VERSION,
			remoteAccess: { enabled: false },
			tunnel: TUNNEL_STATUS,
			backup: { recoveryKeySet: false },
		});
		expect(JSON.stringify(status)).not.toContain(input.token);
		const stored = (await repository.get()).enrollment;
		expect(stored?.token).not.toBe(input.token);
		expect(encryptionService.decrypt(stored?.token ?? "")).toBe(input.token);
	});

	it("accepts an enrollment without an API URL", async () => {
		const { service } = setup();

		const status = await service.enroll(enrollment({ apiUrl: null }));

		expect(status.enrolled).toBe(true);
		expect(status.apiUrl).toBeNull();
	});

	it("refuses a tunnel host that isn't allowed, without saving", async () => {
		const { service, repository } = setup();

		await expectAppError(service.enroll(enrollment({ connectUrl: "wss://evil.example/api/tunnel" })), connectErrors.hostNotAllowed);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("refuses an API host that isn't allowed, without saving", async () => {
		const { service, repository } = setup();

		await expectAppError(service.enroll(enrollment({ apiUrl: "https://evil.example" })), connectErrors.hostNotAllowed);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("accepts a host added to the allowlist", async () => {
		const { service } = setup({ allowedHosts: [".connect.example"] });

		const status = await service.enroll(enrollment({ connectUrl: "wss://relay.connect.example/api/tunnel", apiUrl: "https://api.connect.example" }));

		expect(status.enrolled).toBe(true);
	});

	it("refuses without ENCRYPTION_KEY, without saving", async () => {
		const { service, repository } = setup({ encryptionKey: false });

		await expectAppError(service.enroll(enrollment()), connectErrors.encryptionKeyMissing);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("replaces an existing enrollment", async () => {
		const { service } = setup();
		await service.enroll(enrollment());

		const status = await service.enroll(enrollment({ agentId: "agent-2" }));

		expect(status.agentId).toBe("agent-2");
	});

	it("leaves the tunnel stopped when remote access is off", async () => {
		const { service, tunnel } = setup();

		await service.enroll(enrollment());

		expect(tunnel.start).not.toHaveBeenCalled();
		expect(tunnel.stop).toHaveBeenCalled();
	});

	it("restarts the tunnel with the new credential when remote access is on", async () => {
		const { service, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.start.mockClear();
		const newToken = `cmk_${"b".repeat(48)}`;

		await service.enroll(enrollment({ agentId: "agent-2", token: newToken }));

		expect(tunnel.start).toHaveBeenCalledTimes(1);
		expect(tunnel.start).toHaveBeenCalledWith(expect.objectContaining({ agentId: "agent-2", token: newToken }));
	});
});

describe("ConnectService.unenroll", () => {
	it("clears the enrollment", async () => {
		const { service, repository } = setup();
		await service.enroll(enrollment());

		const status = await service.unenroll();

		expect(status.enrolled).toBe(false);
		expect((await repository.get()).enrollment).toBeNull();
	});

	it("succeeds when never enrolled", async () => {
		const { service } = setup();

		await expect(service.unenroll()).resolves.toMatchObject({ enrolled: false });
	});

	it("works when the stored token can't be decrypted", async () => {
		const { service, repository } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });

		await expect(service.getStatus()).resolves.toMatchObject({ enrolled: true });
		await expect(service.unenroll()).resolves.toMatchObject({ enrolled: false });
	});

	it("stops the tunnel and turns remote access off", async () => {
		const { service, repository, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.stop.mockClear();

		const status = await service.unenroll();

		expect(tunnel.stop).toHaveBeenCalledTimes(1);
		expect(status.remoteAccess.enabled).toBe(false);
		expect((await repository.get()).remoteAccessEnabled).toBe(false);
	});
});

describe("ConnectService.setRemoteAccess", () => {
	it("turns remote access on and starts the tunnel with the decrypted token", async () => {
		const { service, repository, tunnel } = setup();
		const input = enrollment();
		await service.enroll(input);

		const status = await service.setRemoteAccess(true);

		expect(status.remoteAccess.enabled).toBe(true);
		expect((await repository.get()).remoteAccessEnabled).toBe(true);
		expect(tunnel.start).toHaveBeenCalledWith({ ...input });
	});

	it("turns remote access off and stops the tunnel", async () => {
		const { service, repository, tunnel } = setup();
		await service.enroll(enrollment());
		await service.setRemoteAccess(true);
		tunnel.stop.mockClear();

		const status = await service.setRemoteAccess(false);

		expect(status.remoteAccess.enabled).toBe(false);
		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.stop).toHaveBeenCalledTimes(1);
	});

	it("refuses to turn it on when not enrolled, without saving or starting", async () => {
		const { service, repository, tunnel } = setup();

		await expectAppError(service.setRemoteAccess(true), connectErrors.notEnrolled);

		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("refuses to turn it on when the stored token can't be decrypted, without saving", async () => {
		const { service, repository, tunnel } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });

		await expectAppError(service.setRemoteAccess(true), connectErrors.stateUnavailable);

		expect((await repository.get()).remoteAccessEnabled).toBe(false);
		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("turns it off when not enrolled without error", async () => {
		const { service, tunnel } = setup();

		await expect(service.setRemoteAccess(false)).resolves.toMatchObject({ remoteAccess: { enabled: false } });
		expect(tunnel.stop).toHaveBeenCalled();
	});
});

describe("ConnectService.start", () => {
	it("starts the tunnel with the decrypted token when enrolled with remote access on", async () => {
		const { service, repository, encryptionService, tunnel } = setup();
		const input = enrollment();
		await repository.setEnrollment({ ...input, token: encryptionService.encrypt(input.token) });
		await repository.setRemoteAccess(true);

		await service.start();

		expect(tunnel.start).toHaveBeenCalledTimes(1);
		expect(tunnel.start).toHaveBeenCalledWith({ ...input });
	});

	it("doesn't start the tunnel when remote access is off", async () => {
		const { service, repository, encryptionService, tunnel } = setup();
		await repository.setEnrollment({ ...enrollment(), token: encryptionService.encrypt(enrollment().token) });

		await service.start();

		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("doesn't start the tunnel when not enrolled", async () => {
		const { service, tunnel } = setup();

		await service.start();

		expect(tunnel.start).not.toHaveBeenCalled();
	});

	it("logs and doesn't throw when the stored token can't be decrypted", async () => {
		const { service, repository, tunnel, logger } = setup();
		await repository.setEnrollment({ ...enrollment(), token: "v1.not.a.valid.ciphertext" });
		await repository.setRemoteAccess(true);

		await expect(service.start()).resolves.toBeUndefined();

		expect(tunnel.start).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(AppError) }), "Connect could not start remote access");
	});

	it("logs and doesn't throw when the state can't be read", async () => {
		const { service, repository, logger } = setup();
		const failure = new Error("connection refused");
		jest.spyOn(repository, "get").mockRejectedValue(failure);

		await expect(service.start()).resolves.toBeUndefined();

		expect(logger.error).toHaveBeenCalledWith({ err: failure }, "Connect could not start remote access");
	});
});

describe("ConnectService.stop", () => {
	it("stops the tunnel", () => {
		const { service, tunnel } = setup();

		service.stop();

		expect(tunnel.stop).toHaveBeenCalledTimes(1);
	});
});

describe("ConnectService.getStatus (backup)", () => {
	it("reports whether a recovery key is set", async () => {
		const ctx = setup();
		await enrollStored(ctx);
		expect((await ctx.service.getStatus()).backup).toEqual({
			recoveryKeySet: false,
		});

		await ctx.repository.setRecoveryKeyIfUnset(ctx.encryptionService.encrypt(RECOVERY_KEY));
		expect((await ctx.service.getStatus()).backup).toEqual({
			recoveryKeySet: true,
		});
	});

	it("never includes the recovery key", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		expect(JSON.stringify(await ctx.service.getStatus())).not.toContain(RECOVERY_KEY);
	});
});

describe("ConnectService.createRecoveryKey", () => {
	it("generates a 64-character key once, stores it encrypted and returns the format", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		const created = await ctx.service.createRecoveryKey(false);

		expect(created).toEqual({
			recoveryKey: expect.stringMatching(/^[a-f0-9]{64}$/),
			format: "CMKB1",
		});
		const stored = (await ctx.repository.get()).recoveryKey ?? "";
		expect(stored).not.toBe(created.recoveryKey);
		expect(ctx.encryptionService.decrypt(stored)).toBe(created.recoveryKey);
		await expectAppError(ctx.service.createRecoveryKey(false), connectErrors.recoveryKeyAlreadySet);
	});

	it("creates one key when two requests race", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		const results = await Promise.allSettled([ctx.service.createRecoveryKey(false), ctx.service.createRecoveryKey(false)]);

		expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
		const rejected = results.find((result) => result.status === "rejected");
		expect((rejected as PromiseRejectedResult).reason.definition).toBe(connectErrors.recoveryKeyAlreadySet);
	});

	it("refuses while cloud backups exist, without saving", async () => {
		const ctx = setup({ backups: [cloudBackup()] });
		await enrollStored(ctx);

		await expectAppError(ctx.service.createRecoveryKey(false), connectErrors.cloudBackupsExist);
		expect((await ctx.repository.get()).recoveryKey).toBeNull();
	});

	it("lists with the decrypted token", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		await ctx.service.createRecoveryKey(false);

		expect(ctx.connectApiService.list).toHaveBeenCalledWith(enrollment());
	});

	it("fails closed when backups can't be listed, with the cloud's message", async () => {
		const ctx = setup({ listError: new Error("network down") });
		await enrollStored(ctx);

		const error = await ctx.service.createRecoveryKey(false).catch((caught: unknown) => caught);

		expect((error as AppError).definition).toBe(connectErrors.connectUnreachable);
		expect((error as AppError).message).toBe("network down");
		expect((await ctx.repository.get()).recoveryKey).toBeNull();
	});

	it("generates over existing backups without listing when told to discard them", async () => {
		const ctx = setup({ backups: [cloudBackup()] });
		await enrollStored(ctx);

		await expect(ctx.service.createRecoveryKey(true)).resolves.toMatchObject({
			format: "CMKB1",
		});
		expect(ctx.connectApiService.list).not.toHaveBeenCalled();
	});

	it("requires enrollment", async () => {
		const ctx = setup();

		await expectAppError(ctx.service.createRecoveryKey(false), connectErrors.notEnrolled);
	});

	it("requires ENCRYPTION_KEY", async () => {
		const ctx = setup({ encryptionKey: false });
		await ctx.repository.setEnrollment({ ...enrollment(), token: "v1.stored" });

		await expectAppError(ctx.service.createRecoveryKey(true), connectErrors.encryptionKeyMissing);
	});

	it("reports an unreadable token instead of listing", async () => {
		const ctx = setup();
		await ctx.repository.setEnrollment({
			...enrollment(),
			token: "v1.not.a.valid.ciphertext",
		});

		await expectAppError(ctx.service.createRecoveryKey(false), connectErrors.stateUnavailable);
		expect(ctx.connectApiService.list).not.toHaveBeenCalled();
	});

	it("keeps the recovery key after unenrolling", async () => {
		const ctx = setup();
		await enrollStored(ctx);
		await ctx.service.createRecoveryKey(false);

		await ctx.service.unenroll();

		expect((await ctx.repository.get()).recoveryKey).not.toBeNull();
	});
});

describe("ConnectService.runBackup", () => {
	it("records the operation and arms the job row", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await expect(ctx.service.runBackup("config")).resolves.toEqual({
			queued: true,
		});

		expect((await ctx.repository.get()).operation).toEqual({
			type: "backup",
			kind: "config",
			requestedAt: expect.any(Date),
			startedAt: null,
		});
		expect(ctx.scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
	});

	it("refuses a second backup while one is queued", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");

		await expectAppError(ctx.service.runBackup("full"), connectErrors.busy);
		expect(ctx.scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
	});

	it("requires enrollment", async () => {
		const ctx = setup();

		await expectAppError(ctx.service.runBackup("full"), connectErrors.notEnrolled);
	});

	it("requires a recovery key", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		await expectAppError(ctx.service.runBackup("full"), connectErrors.noRecoveryKey);
		expect(ctx.scheduler.addGlobalJob).not.toHaveBeenCalled();
	});
});

describe("ConnectService.getBackupStatus", () => {
	it("reports nothing running with no result before the first backup", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await expect(ctx.service.getBackupStatus()).resolves.toEqual({
			operation: null,
			progress: null,
			lastBackup: null,
			lastRestore: null,
			lastVerify: null,
			missingTools: [],
		});
	});

	it("shows a queued operation until a worker starts it", async () => {
		const ctx = setup({ running: false });
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");

		const status = await ctx.service.getBackupStatus();

		expect(status.operation).toEqual({
			type: "backup",
			state: "queued",
			requestedAt: expect.any(String),
		});
	});

	it("shows a running operation with its progress while the row is locked", async () => {
		const ctx = setup({ running: true });
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");
		await ctx.repository.markOperationStarted(new Date());
		await ctx.repository.setProgress({
			operation: "backup",
			stage: "uploading",
			percent: 40,
			bytes: null,
			attempt: null,
			attempts: null,
		});

		const status = await ctx.service.getBackupStatus();

		expect(status.operation?.state).toBe("running");
		expect(status.progress).toEqual({
			operation: "backup",
			stage: "uploading",
			percent: 40,
			bytes: null,
			attempt: null,
			attempts: null,
		});
	});

	it("hides stale progress and shows a crashed worker's operation as queued", async () => {
		const ctx = setup({ running: false });
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");
		await ctx.repository.markOperationStarted(new Date());
		await ctx.repository.setProgress({
			operation: "backup",
			stage: "dumping",
			percent: null,
			bytes: 10,
			attempt: null,
			attempts: null,
		});

		const status = await ctx.service.getBackupStatus();

		expect(status.operation?.state).toBe("queued");
		expect(status.progress).toBeNull();
	});

	it("reports the last backup with an ISO date", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		const at = new Date("2026-11-11T10:05:00.000Z");
		await ctx.repository.setLastBackup({
			ok: false,
			at,
			kind: "full",
			sizeBytes: null,
			sha256: null,
			backupId: null,
			durationMs: null,
			error: "boom",
		});

		expect((await ctx.service.getBackupStatus()).lastBackup).toEqual({
			ok: false,
			at: "2026-11-11T10:05:00.000Z",
			kind: "full",
			sizeBytes: null,
			sha256: null,
			backupId: null,
			durationMs: null,
			error: "boom",
		});
	});

	it.each([
		["no worker has reported", [liveWorker()], []],
		[
			"one worker has both tools",
			[
				liveWorker({ connectTools: { missing: ["mongodump"], checkedAt: 1 } }),
				liveWorker({
					workerId: "w2",
					connectTools: { missing: [], checkedAt: 1 },
				}),
			],
			[],
		],
		[
			"each tool is on some worker",
			[
				liveWorker({ connectTools: { missing: ["mongodump"], checkedAt: 1 } }),
				liveWorker({
					workerId: "w2",
					connectTools: { missing: ["mongorestore"], checkedAt: 1 },
				}),
			],
			[],
		],
		[
			"every worker lacks mongodump",
			[
				liveWorker({ connectTools: { missing: ["mongodump"], checkedAt: 1 } }),
				liveWorker({
					workerId: "w2",
					connectTools: {
						missing: ["mongodump", "mongorestore"],
						checkedAt: 1,
					},
				}),
			],
			["mongodump"],
		],
		[
			"only a worker that doesn't process jobs has them",
			[
				liveWorker({
					connectTools: {
						missing: ["mongodump", "mongorestore"],
						checkedAt: 1,
					},
				}),
				liveWorker({
					workerId: "api",
					processesJobs: false,
					connectTools: { missing: [], checkedAt: 1 },
				}),
			],
			["mongodump", "mongorestore"],
		],
	])("missingTools when %s", async (_label, workers, expected) => {
		const ctx = setup({ workers });
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		expect((await ctx.service.getBackupStatus()).missingTools).toEqual(expected);
		expect(ctx.queueWorkersRepository.findRecent).toHaveBeenCalledWith(180_000);
	});
});

describe("ConnectService.listBackups", () => {
	it("marks backups restorable by the current key's fingerprint", async () => {
		const ctx = setup({
			backups: [
				cloudBackup({ id: "mine", keyId: recoveryKeyId(RECOVERY_KEY) }),
				cloudBackup({ id: "other", keyId: "ff".repeat(16) }),
				cloudBackup({ id: "old" }),
			],
		});
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		const { backups } = await ctx.service.listBackups();

		expect(backups.map((backup) => [backup.id, backup.restorable])).toEqual([
			["mine", true],
			["other", false],
			["old", true],
		]);
		expect(backups[2]).toEqual({
			...cloudBackup({ id: "old" }),
			keyId: null,
			expiresAt: null,
			restorable: true,
		});
	});

	it("marks only backups without a fingerprint restorable when no key is set", async () => {
		const ctx = setup({
			backups: [cloudBackup({ id: "keyed", keyId: "ff".repeat(16) }), cloudBackup({ id: "old" })],
		});
		await enrollStored(ctx);

		const { backups } = await ctx.service.listBackups();

		expect(backups.map((backup) => backup.restorable)).toEqual([false, true]);
	});

	it("requires enrollment", async () => {
		const ctx = setup();

		await expectAppError(ctx.service.listBackups(), connectErrors.notEnrolled);
	});

	it("reports an unreachable Connect API", async () => {
		const ctx = setup({ listError: new Error("credential revoked") });
		await enrollStored(ctx);

		await expectAppError(ctx.service.listBackups(), connectErrors.connectUnreachable);
	});
});

describe("ConnectService.start (operations)", () => {
	it("re-arms the job row when an operation is recorded", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.repository.requestOperation({
			type: "backup",
			kind: "full",
			requestedAt: new Date(),
			startedAt: null,
		});

		await ctx.service.start();

		expect(ctx.scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
	});

	it("leaves the row alone when nothing is recorded", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await ctx.service.start();

		expect(ctx.scheduler.addGlobalJob).not.toHaveBeenCalled();
	});

	it("still starts the tunnel when the row can't be armed", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.repository.setRemoteAccess(true);
		await ctx.repository.requestOperation({
			type: "backup",
			kind: "full",
			requestedAt: new Date(),
			startedAt: null,
		});
		ctx.scheduler.addGlobalJob.mockRejectedValue(new Error("db down"));

		await ctx.service.start();

		expect(ctx.logger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "Connect could not re-queue its pending operation");
		expect(ctx.tunnel.start).toHaveBeenCalledTimes(1);
	});
});

describe("ConnectService.importRecoveryKey", () => {
	const CANDIDATE = "ef".repeat(32);

	it("queues a check with the candidate encrypted", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		await expect(ctx.service.importRecoveryKey(CANDIDATE, false)).resolves.toEqual({ queued: true });

		const { operation } = await ctx.repository.get();
		expect(operation).toEqual({
			type: "verify",
			recoveryKey: expect.any(String),
			replaceExisting: false,
			requestedAt: expect.any(Date),
			startedAt: null,
		});
		expect(operation?.type === "verify" && operation.recoveryKey).not.toBe(CANDIDATE);
		expect(operation?.type === "verify" && ctx.encryptionService.decrypt(operation.recoveryKey)).toBe(CANDIDATE);
		expect(ctx.scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
	});

	it("queues a first key even when asked to replace", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		await ctx.service.importRecoveryKey(CANDIDATE, true);

		expect((await ctx.repository.get()).operation).toMatchObject({ type: "verify", replaceExisting: true });
	});

	it("doesn't replace an existing key unless asked", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await expectAppError(ctx.service.importRecoveryKey(CANDIDATE, false), connectErrors.recoveryKeyAlreadySet);
		expect((await ctx.repository.get()).operation).toBeNull();
		expect(ctx.scheduler.addGlobalJob).not.toHaveBeenCalled();
	});

	it("queues a replacement when asked", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await ctx.service.importRecoveryKey(CANDIDATE, true);

		expect((await ctx.repository.get()).operation).toMatchObject({ type: "verify", replaceExisting: true });
	});

	it("refuses the key that is already saved without checking backups", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await expectAppError(ctx.service.importRecoveryKey(RECOVERY_KEY, true), connectErrors.sameRecoveryKey);
		expect((await ctx.repository.get()).operation).toBeNull();
		expect(ctx.scheduler.addGlobalJob).not.toHaveBeenCalled();
	});

	it("reports unavailable state when the saved key can't be decrypted", async () => {
		const ctx = setup();
		await enrollStored(ctx);
		await ctx.repository.setRecoveryKeyIfUnset("v1.not.a.valid.ciphertext");

		await expectAppError(ctx.service.importRecoveryKey(CANDIDATE, true), connectErrors.stateUnavailable);
	});

	it("requires enrollment", async () => {
		const ctx = setup();

		await expectAppError(ctx.service.importRecoveryKey(CANDIDATE, false), connectErrors.notEnrolled);
	});

	it("requires ENCRYPTION_KEY", async () => {
		const ctx = setup({ encryptionKey: false });
		await ctx.repository.setEnrollment({ ...enrollment(), token: "v1.stored" });

		await expectAppError(ctx.service.importRecoveryKey(CANDIDATE, false), connectErrors.encryptionKeyMissing);
	});

	it("is busy while another operation is queued", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");

		await expectAppError(ctx.service.importRecoveryKey(CANDIDATE, true), connectErrors.busy);
		expect((await ctx.repository.get()).operation?.type).toBe("backup");
	});

	it("never shows the candidate key in the status", async () => {
		const ctx = setup();
		await enrollStored(ctx);
		await ctx.service.importRecoveryKey(CANDIDATE, false);

		const status = await ctx.service.getBackupStatus();

		expect(status.operation).toEqual({ type: "verify", state: "queued", requestedAt: expect.any(String) });
		expect(JSON.stringify(status)).not.toContain(CANDIDATE);
	});
});

describe("ConnectService.restoreBackup", () => {
	const BACKUP_ID = "11111111-1111-1111-1111-111111111111";

	it("queues the restore", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });

		await expect(ctx.service.restoreBackup(BACKUP_ID)).resolves.toEqual({ queued: true });

		expect((await ctx.repository.get()).operation).toEqual({
			type: "restore",
			backupId: BACKUP_ID,
			requestedAt: expect.any(Date),
			startedAt: null,
		});
		expect(ctx.scheduler.addGlobalJob).toHaveBeenCalledWith("connect-operation");
	});

	it("requires a recovery key", async () => {
		const ctx = setup();
		await enrollStored(ctx);

		await expectAppError(ctx.service.restoreBackup(BACKUP_ID), connectErrors.restoreNeedsRecoveryKey);
		expect(ctx.scheduler.addGlobalJob).not.toHaveBeenCalled();
	});

	it("requires enrollment", async () => {
		const ctx = setup();

		await expectAppError(ctx.service.restoreBackup(BACKUP_ID), connectErrors.notEnrolled);
	});

	it("is busy while another operation is queued", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.runBackup("full");

		await expectAppError(ctx.service.restoreBackup(BACKUP_ID), connectErrors.busy);
		expect((await ctx.repository.get()).operation?.type).toBe("backup");
	});
});

describe("ConnectService.getBackupStatus (restore and verify)", () => {
	it("reports the last restore and key check with ISO dates", async () => {
		const ctx = setup();
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		const at = new Date("2026-11-12T10:05:00.000Z");
		await ctx.repository.setLastRestore({
			ok: true,
			at,
			kind: null,
			sizeBytes: null,
			sha256: null,
			backupId: "b-9",
			durationMs: 900,
			error: null,
		});
		await ctx.repository.setLastVerify({ outcome: "wrong-key", at, error: null });

		const status = await ctx.service.getBackupStatus();

		expect(status.lastRestore).toEqual({
			ok: true,
			at: "2026-11-12T10:05:00.000Z",
			kind: null,
			sizeBytes: null,
			sha256: null,
			backupId: "b-9",
			durationMs: 900,
			error: null,
		});
		expect(status.lastVerify).toEqual({ outcome: "wrong-key", at: "2026-11-12T10:05:00.000Z", error: null });
	});

	it("shows a running restore with its progress", async () => {
		const ctx = setup({ running: true });
		await enrollStored(ctx, { recoveryKey: RECOVERY_KEY });
		await ctx.service.restoreBackup("b-9");
		await ctx.repository.markOperationStarted(new Date());
		await ctx.repository.setProgress({ operation: "restore", stage: "restoring", percent: null, bytes: null, attempt: null, attempts: null });

		const status = await ctx.service.getBackupStatus();

		expect(status.operation).toEqual({ type: "restore", state: "running", requestedAt: expect.any(String) });
		expect(status.progress).toMatchObject({ operation: "restore", stage: "restoring" });
	});
});
