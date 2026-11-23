import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectOperationService } from "../../../src/domain/connect/connect-operation.service.ts";
import type { ConnectBackupResult, ConnectKeyCheck, ConnectOperationRequest } from "../../../src/domain/connect/connect-backup.type.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";
import type { IJobScheduler } from "../../../src/worker/worker.interface.ts";

const TOKEN = `cmk_${"a".repeat(48)}`;
const KEY = "ab".repeat(32);

const succeeded: ConnectBackupResult = {
	ok: true,
	at: new Date("2026-11-11T10:05:00.000Z"),
	kind: "config",
	sizeBytes: 2048,
	sha256: "cd".repeat(32),
	backupId: "b-1",
	durationMs: 500,
	error: null,
};

const restored: ConnectBackupResult = {
	ok: true,
	at: new Date("2026-11-12T10:05:00.000Z"),
	kind: null,
	sizeBytes: null,
	sha256: null,
	backupId: "b-9",
	durationMs: 900,
	error: null,
};

const setup = async (
	opts: {
		queued?: boolean;
		enrolled?: boolean;
		recoveryKey?: boolean;
		hasTool?: boolean;
		missingTool?: string;
		elsewhere?: boolean;
		token?: string;
		result?: ConnectBackupResult;
		restoreResult?: ConnectBackupResult;
		verifyOutcome?: ConnectKeyCheck;
		verifyError?: Error;
		operation?: ConnectOperationRequest;
		encryptionService?: EncryptionService;
		reconcileError?: Error;
	} = {}
) => {
	const logger = createMockLogger();
	const encryptionService = opts.encryptionService ?? new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger() as any, nodeCrypto);
	const repository = new InMemoryConnectRepository();
	await repository.setEnrollment({
		connectUrl: "wss://relay.checkmate.so/api/tunnel",
		agentId: "inst-1",
		token: opts.token ?? encryptionService.encrypt(TOKEN),
		apiUrl: null,
	});
	if (opts.recoveryKey !== false) await repository.setRecoveryKeyIfUnset(encryptionService.encrypt(KEY));
	if (opts.queued !== false)
		await repository.requestOperation(
			opts.operation ?? {
				type: "backup",
				kind: "config",
				requestedAt: new Date(),
				startedAt: null,
			}
		);
	if (opts.enrolled === false) await repository.clearEnrollment();
	const connectBackupService = {
		backup: jest.fn<any>(async () => {
			expect((await repository.get()).operation?.startedAt).toBeInstanceOf(Date);
			return opts.result ?? succeeded;
		}),
		restore: jest.fn<any>(async () => {
			expect((await repository.get()).operation?.startedAt).toBeInstanceOf(Date);
			return opts.restoreResult ?? restored;
		}),
		verify: jest.fn<any>(async () => {
			expect((await repository.get()).operation?.startedAt).toBeInstanceOf(Date);
			if (opts.verifyError) throw opts.verifyError;
			return opts.verifyOutcome ?? "ok";
		}),
	};
	const connectToolsService = {
		report: jest.fn<any>(),
		hasTool: jest.fn((tool: string) => (opts.missingTool === tool ? false : (opts.hasTool ?? true))),
		isAvailableOnAnotherWorker: jest.fn<any>().mockResolvedValue(opts.elsewhere ?? false),
	};
	const scheduler = {
		reconcile: jest.fn(async () => {
			if (opts.reconcileError) throw opts.reconcileError;
		}),
	};
	const job = new ConnectOperationService(
		repository,
		encryptionService,
		connectBackupService,
		connectToolsService,
		scheduler as unknown as IJobScheduler,
		logger as any
	);
	return { job, repository, connectBackupService, connectToolsService, scheduler, logger };
};

describe("ConnectOperationService.handleJob", () => {
	it("runs the queued backup with decrypted secrets, records the result and clears the operation", async () => {
		const { job, repository, connectBackupService } = await setup();

		await job.handleJob();

		expect(connectBackupService.backup).toHaveBeenCalledWith({
			enrollment: {
				connectUrl: "wss://relay.checkmate.so/api/tunnel",
				agentId: "inst-1",
				token: TOKEN,
				apiUrl: null,
			},
			recoveryKey: KEY,
			kind: "config",
		});
		const state = await repository.get();
		expect(state.lastBackup).toEqual(succeeded);
		expect(state.operation).toBeNull();
		expect(state.progress).toBeNull();
	});

	it("records a failed backup the same way", async () => {
		const failed = {
			...succeeded,
			ok: false,
			sizeBytes: null,
			sha256: null,
			backupId: null,
			durationMs: null,
			error: "blob upload failed (500)",
		};
		const { job, repository } = await setup({ result: failed });

		await job.handleJob();

		const state = await repository.get();
		expect(state.lastBackup).toEqual(failed);
		expect(state.operation).toBeNull();
	});

	it("returns quietly when no operation is recorded", async () => {
		const { job, repository, connectBackupService } = await setup({
			queued: false,
		});

		await job.handleJob();

		expect(connectBackupService.backup).not.toHaveBeenCalled();
		expect((await repository.get()).lastBackup).toBeNull();
	});

	it("hands off without starting when this worker lacks mongodump and another has it", async () => {
		const { job, repository, connectBackupService } = await setup({
			hasTool: false,
			elsewhere: true,
		});

		await expect(job.handleJob()).rejects.toThrow("mongodump is not installed on this worker; leaving the operation to a worker that has it");

		expect(connectBackupService.backup).not.toHaveBeenCalled();
		const state = await repository.get();
		expect(state.operation).not.toBeNull();
		expect(state.operation?.startedAt).toBeNull();
	});

	it("records a failure when no worker has mongodump", async () => {
		const { job, repository, connectBackupService } = await setup({
			hasTool: false,
			elsewhere: false,
		});

		await job.handleJob();

		expect(connectBackupService.backup).not.toHaveBeenCalled();
		const state = await repository.get();
		expect(state.lastBackup).toMatchObject({
			ok: false,
			kind: "config",
			error: "mongodump not available on any worker",
		});
		expect(state.operation).toBeNull();
	});

	it("records a failure when the installation was unenrolled after queuing", async () => {
		const { job, repository } = await setup({ enrolled: false });

		await job.handleJob();

		expect((await repository.get()).lastBackup).toMatchObject({
			ok: false,
			error: "This installation is not enrolled with Checkmate Connect",
		});
	});

	it("records a failure when the secrets can't be decrypted", async () => {
		const { job, repository, connectBackupService, logger } = await setup({
			token: "v1.not.a.valid.ciphertext",
		});

		await job.handleJob();

		expect(connectBackupService.backup).not.toHaveBeenCalled();
		expect((await repository.get()).lastBackup).toMatchObject({
			ok: false,
			error: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs",
		});
		expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Connect backup skipped: the stored secrets can't be decrypted");
	});

	it("records a failure when the recovery key is gone", async () => {
		const { job, repository } = await setup({ recoveryKey: false });

		await job.handleJob();

		expect((await repository.get()).lastBackup).toMatchObject({
			ok: false,
			error: "No recovery key set",
		});
	});

	it("lets a database failure reach the queue so the row is retried", async () => {
		const { job, repository } = await setup();
		jest.spyOn(repository, "get").mockRejectedValue(new Error("db down"));

		await expect(job.handleJob()).rejects.toThrow("db down");
	});

	it("never rebuilds jobs after a backup", async () => {
		const { job, scheduler } = await setup();

		await job.handleJob();

		expect(scheduler.reconcile).not.toHaveBeenCalled();
	});
});

describe("ConnectOperationService.handleJob (restore)", () => {
	const restoreOp = (): ConnectOperationRequest => ({
		type: "restore",
		backupId: "b-9",
		requestedAt: new Date(),
		startedAt: null,
	});

	it("restores with decrypted secrets, records the result and clears the operation", async () => {
		const { job, repository, connectBackupService } = await setup({ operation: restoreOp() });

		await job.handleJob();

		expect(connectBackupService.restore).toHaveBeenCalledWith({
			enrollment: {
				connectUrl: "wss://relay.checkmate.so/api/tunnel",
				agentId: "inst-1",
				token: TOKEN,
				apiUrl: null,
			},
			recoveryKey: KEY,
			backupId: "b-9",
		});
		expect(connectBackupService.backup).not.toHaveBeenCalled();
		const state = await repository.get();
		expect(state.lastRestore).toEqual(restored);
		expect(state.lastBackup).toBeNull();
		expect(state.operation).toBeNull();
	});

	it("records a failed restore the same way", async () => {
		const failed = { ...restored, ok: false, durationMs: null, error: "restore wrote no data" };
		const { job, repository } = await setup({ operation: restoreOp(), restoreResult: failed });

		await job.handleJob();

		const state = await repository.get();
		expect(state.lastRestore).toEqual(failed);
		expect(state.operation).toBeNull();
	});

	it("hands a restore to a worker with mongorestore", async () => {
		const { job, repository, connectBackupService } = await setup({
			operation: restoreOp(),
			missingTool: "mongorestore",
			elsewhere: true,
		});

		await expect(job.handleJob()).rejects.toThrow("mongorestore is not installed on this worker; leaving the operation to a worker that has it");
		expect(connectBackupService.restore).not.toHaveBeenCalled();
		expect((await repository.get()).operation?.startedAt).toBeNull();
	});

	it("records a failure when no worker has mongorestore", async () => {
		const { job, repository } = await setup({
			operation: restoreOp(),
			missingTool: "mongorestore",
			elsewhere: false,
		});

		await job.handleJob();

		const state = await repository.get();
		expect(state.lastRestore).toMatchObject({
			ok: false,
			kind: null,
			backupId: "b-9",
			error: "mongorestore not available on any worker",
		});
		expect(state.operation).toBeNull();
	});

	it("doesn't need mongodump", async () => {
		const { job, connectBackupService } = await setup({
			operation: restoreOp(),
			missingTool: "mongodump",
		});

		await job.handleJob();

		expect(connectBackupService.restore).toHaveBeenCalledTimes(1);
	});

	it("records a failure when the recovery key is gone", async () => {
		const { job, repository } = await setup({ operation: restoreOp(), recoveryKey: false });

		await job.handleJob();

		expect((await repository.get()).lastRestore).toMatchObject({
			ok: false,
			backupId: "b-9",
			error: "Restores need the original recovery key",
		});
	});

	it("records a failure when the installation was unenrolled after queuing", async () => {
		const { job, repository } = await setup({ operation: restoreOp(), enrolled: false });

		await job.handleJob();

		expect((await repository.get()).lastRestore).toMatchObject({
			ok: false,
			error: "This installation is not enrolled with Checkmate Connect",
		});
	});

	it("records a failure when the secrets can't be decrypted", async () => {
		const { job, repository, connectBackupService } = await setup({
			operation: restoreOp(),
			token: "v1.not.a.valid.ciphertext",
		});

		await job.handleJob();

		expect(connectBackupService.restore).not.toHaveBeenCalled();
		expect((await repository.get()).lastRestore).toMatchObject({
			ok: false,
			error: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs",
		});
	});

	it("rebuilds jobs after a successful restore, before clearing the operation", async () => {
		const { job, repository, scheduler } = await setup({ operation: restoreOp() });
		scheduler.reconcile.mockImplementation(async () => {
			expect((await repository.get()).operation).not.toBeNull();
		});

		await job.handleJob();

		expect(scheduler.reconcile).toHaveBeenCalledTimes(1);
		expect((await repository.get()).operation).toBeNull();
	});

	it("doesn't rebuild jobs after a failed restore", async () => {
		const { job, scheduler } = await setup({
			operation: restoreOp(),
			restoreResult: { ...restored, ok: false, durationMs: null, error: "restore wrote no data" },
		});

		await job.handleJob();

		expect(scheduler.reconcile).not.toHaveBeenCalled();
	});

	it("still records the restore when rebuilding jobs fails", async () => {
		const { job, repository, logger } = await setup({ operation: restoreOp(), reconcileError: new Error("db down") });

		await job.handleJob();

		const state = await repository.get();
		expect(state.lastRestore).toEqual(restored);
		expect(state.operation).toBeNull();
		expect(logger.error).toHaveBeenCalledWith(
			{ err: expect.any(Error) },
			"Could not rebuild jobs after the Connect restore; restart Checkmate to rebuild them"
		);
	});
});

describe("ConnectOperationService.handleJob (verify)", () => {
	const CANDIDATE = "ef".repeat(32);

	const verifySetup = async (opts: Parameters<typeof setup>[0] & { replaceExisting?: boolean; savedKey?: boolean } = {}) => {
		const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger() as any, nodeCrypto);
		const context = await setup({
			...opts,
			encryptionService,
			recoveryKey: opts.savedKey ?? false,
			operation: {
				type: "verify",
				recoveryKey: encryptionService.encrypt(CANDIDATE),
				replaceExisting: opts.replaceExisting ?? false,
				requestedAt: new Date(),
				startedAt: null,
			},
		});
		return { ...context, encryptionService };
	};

	it("checks the decrypted candidate and saves it as the first key", async () => {
		const { job, repository, connectBackupService, encryptionService, scheduler } = await verifySetup();

		await job.handleJob();

		expect(connectBackupService.verify).toHaveBeenCalledWith({
			enrollment: expect.objectContaining({ token: TOKEN }),
			recoveryKey: CANDIDATE,
		});
		const state = await repository.get();
		expect(encryptionService.decrypt(state.recoveryKey ?? "")).toBe(CANDIDATE);
		expect(state.lastVerify).toEqual({ outcome: "ok", at: expect.any(Date), error: null });
		expect(state.operation).toBeNull();
		expect(scheduler.reconcile).not.toHaveBeenCalled();
	});

	it("replaces the saved key when asked", async () => {
		const { job, repository, encryptionService } = await verifySetup({
			savedKey: true,
			replaceExisting: true,
		});

		await job.handleJob();

		const state = await repository.get();
		expect(encryptionService.decrypt(state.recoveryKey ?? "")).toBe(CANDIDATE);
		expect(state.lastVerify).toMatchObject({ outcome: "ok", error: null });
	});

	it("records a wrong key and leaves the saved key untouched", async () => {
		const { job, repository, encryptionService } = await verifySetup({
			savedKey: true,
			replaceExisting: true,
			verifyOutcome: "wrong-key",
		});

		await job.handleJob();

		const state = await repository.get();
		expect(encryptionService.decrypt(state.recoveryKey ?? "")).toBe(KEY);
		expect(state.lastVerify).toMatchObject({ outcome: "wrong-key", error: null });
		expect(state.operation).toBeNull();
	});

	it("records when there are no backups to check against", async () => {
		const { job, repository } = await verifySetup({ verifyOutcome: "no-backups" });

		await job.handleJob();

		const state = await repository.get();
		expect(state.recoveryKey).toBeNull();
		expect(state.lastVerify).toMatchObject({ outcome: "no-backups", error: null });
	});

	it("records a check that couldn't run as failed, with the reason", async () => {
		const { job, repository, logger } = await verifySetup({
			verifyError: new Error("blob download failed (500)"),
		});

		await job.handleJob();

		const state = await repository.get();
		expect(state.recoveryKey).toBeNull();
		expect(state.lastVerify).toMatchObject({ outcome: "failed", error: "blob download failed (500)" });
		expect(state.operation).toBeNull();
		expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Connect recovery key check failed");
	});

	it("records failed when another key was saved while the check ran", async () => {
		const { job, repository, connectBackupService } = await verifySetup();
		connectBackupService.verify.mockImplementation(async () => {
			await repository.setRecoveryKeyIfUnset("v1.someone-else");
			return "ok";
		});

		await job.handleJob();

		const state = await repository.get();
		expect(state.recoveryKey).toBe("v1.someone-else");
		expect(state.lastVerify).toMatchObject({ outcome: "failed", error: "Recovery key already set" });
	});

	it("records a failure when the installation was unenrolled after queuing", async () => {
		const { job, repository, connectBackupService } = await verifySetup({ enrolled: false });

		await job.handleJob();

		expect(connectBackupService.verify).not.toHaveBeenCalled();
		expect((await repository.get()).lastVerify).toMatchObject({
			outcome: "failed",
			error: "This installation is not enrolled with Checkmate Connect",
		});
	});

	it("records a failure when the candidate can't be decrypted", async () => {
		const { job, repository, connectBackupService } = await verifySetup({ token: "v1.not.a.valid.ciphertext" });

		await job.handleJob();

		expect(connectBackupService.verify).not.toHaveBeenCalled();
		expect((await repository.get()).lastVerify).toMatchObject({
			outcome: "failed",
			error: "Connect state is not available. If this continues, check ENCRYPTION_KEY and the server logs",
		});
	});

	it("needs neither tool", async () => {
		const { job, connectBackupService, connectToolsService } = await verifySetup({
			hasTool: false,
			elsewhere: true,
		});

		await job.handleJob();

		expect(connectBackupService.verify).toHaveBeenCalledTimes(1);
		expect(connectToolsService.hasTool).not.toHaveBeenCalled();
	});
});
