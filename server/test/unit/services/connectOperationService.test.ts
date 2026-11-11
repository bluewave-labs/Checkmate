import { describe, expect, it, jest } from "@jest/globals";
import * as nodeCrypto from "node:crypto";
import { ConnectOperationService } from "../../../src/domain/connect/connect-operation.service.ts";
import type { ConnectBackupResult } from "../../../src/domain/connect/connect-backup.type.ts";
import { EncryptionService } from "../../../src/service/encryption/encryptionService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

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

const setup = async (
	opts: {
		queued?: boolean;
		enrolled?: boolean;
		recoveryKey?: boolean;
		hasTool?: boolean;
		elsewhere?: boolean;
		token?: string;
		result?: ConnectBackupResult;
	} = {}
) => {
	const logger = createMockLogger();
	const encryptionService = new EncryptionService([nodeCrypto.randomBytes(32)], createMockLogger() as any, nodeCrypto);
	const repository = new InMemoryConnectRepository();
	await repository.setEnrollment({
		connectUrl: "wss://relay.checkmate.so/api/tunnel",
		agentId: "inst-1",
		token: opts.token ?? encryptionService.encrypt(TOKEN),
		apiUrl: null,
	});
	if (opts.recoveryKey !== false) await repository.setRecoveryKeyIfUnset(encryptionService.encrypt(KEY));
	if (opts.queued !== false)
		await repository.requestOperation({
			type: "backup",
			kind: "config",
			requestedAt: new Date(),
			startedAt: null,
		});
	if (opts.enrolled === false) await repository.clearEnrollment();
	const connectBackupService = {
		backup: jest.fn<any>(async () => {
			expect((await repository.get()).operation?.startedAt).toBeInstanceOf(Date);
			return opts.result ?? succeeded;
		}),
	};
	const connectToolsService = {
		report: jest.fn<any>(),
		hasTool: jest.fn(() => opts.hasTool ?? true),
		isAvailableOnAnotherWorker: jest.fn<any>().mockResolvedValue(opts.elsewhere ?? false),
	};
	const job = new ConnectOperationService(repository, encryptionService, connectBackupService, connectToolsService, logger as any);
	return { job, repository, connectBackupService, connectToolsService, logger };
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

		await expect(job.handleJob()).rejects.toThrow("mongodump is not installed on this worker; leaving the backup to a worker that has it");

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
});
