import { afterEach, describe, expect, it, jest } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { ConnectBackupService } from "../../../src/domain/connect/connect-backup.service.ts";
import { recoveryKeyId } from "../../../src/domain/connect/connect.backup-format.ts";
import type { IConnectBackupTools } from "../../../src/domain/connect/connect.backup-tools.ts";
import type { ConnectEnrollment } from "../../../src/domain/connect/connect.type.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import { InMemoryConnectRepository } from "../../helpers/InMemoryConnectRepository.ts";

const KEY = "ab".repeat(32);
const ENROLLMENT: ConnectEnrollment = {
	connectUrl: "wss://relay.checkmate.so/api/tunnel",
	agentId: "inst-1",
	token: "cmk_plain",
	apiUrl: null,
};

const setup = async (
	opts: {
		dumpChunks?: Buffer[];
		dumpError?: Error;
		uploadError?: Error;
		completeError?: Error;
	} = {}
) => {
	const logger = createMockLogger();
	const repository = new InMemoryConnectRepository();
	await repository.setEnrollment(ENROLLMENT);
	await repository.requestOperation({
		type: "backup",
		kind: "full",
		requestedAt: new Date(),
		startedAt: null,
	});
	const setProgress = jest.spyOn(repository, "setProgress");
	const dirs: string[] = [];

	const tools: IConnectBackupTools = {
		checkTools: async () => [],
		withWorkDir: async (work) => {
			const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-backup-"));
			dirs.push(dir);
			try {
				return await work(dir, path.join(dir, "mongo.yaml"));
			} finally {
				await fs.promises.rm(dir, { recursive: true, force: true });
			}
		},
		dump: jest.fn(() => {
			const stdout = new PassThrough();
			for (const chunk of opts.dumpChunks ?? [crypto.randomBytes(1_000)]) stdout.write(chunk);
			stdout.end();
			return {
				stdout,
				exited: opts.dumpError ? Promise.reject(opts.dumpError) : Promise.resolve(),
			};
		}),
	};
	const connectApiService = {
		requestUpload: jest.fn<any>().mockResolvedValue({
			uploadUrl: "https://store.private.blob.vercel-storage.com/x",
			backupId: "b-1",
		}),
		upload: jest.fn<any>(async (_url: string, file: string, _size: number, onPercent: (percent: number) => void) => {
			expect(fs.existsSync(file)).toBe(true);
			onPercent(50);
			onPercent(100);
			if (opts.uploadError) throw opts.uploadError;
		}),
		complete: jest.fn<any>(async () => {
			if (opts.completeError) throw opts.completeError;
		}),
		abandon: jest.fn<any>().mockResolvedValue(undefined),
		list: jest.fn<any>(),
	};
	const db = {
		getConnection: async () => ({ connection: { name: "uptime_db" } }),
	};
	const connectBackupService = new ConnectBackupService(tools, connectApiService as any, repository, db as any, logger as any);
	return {
		connectBackupService,
		repository,
		setProgress,
		tools,
		connectApiService,
		logger,
		dirs,
	};
};

afterEach(() => {
	jest.restoreAllMocks();
});

describe("ConnectBackupService.backup", () => {
	it("dumps, encrypts, uploads and completes, and reports the stored backup", async () => {
		const { connectBackupService, tools, connectApiService, dirs } = await setup();

		const result = await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "config",
		});

		expect(tools.dump).toHaveBeenCalledWith(path.join(dirs[0], "mongo.yaml"), "uptime_db", "config");
		const [enrolled, upload] = connectApiService.requestUpload.mock.calls[0] as [ConnectEnrollment, any];
		expect(enrolled).toBe(ENROLLMENT);
		expect(upload).toEqual({
			kind: "config",
			sizeBytes: expect.any(Number),
			sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
			keyId: recoveryKeyId(KEY),
		});
		expect(connectApiService.upload).toHaveBeenCalledWith(
			"https://store.private.blob.vercel-storage.com/x",
			path.join(dirs[0], "backup.cmkb"),
			upload.sizeBytes,
			expect.any(Function)
		);
		expect(connectApiService.complete).toHaveBeenCalledWith(ENROLLMENT, "b-1");
		expect(connectApiService.abandon).not.toHaveBeenCalled();
		expect(result).toEqual({
			ok: true,
			at: expect.any(Date),
			kind: "config",
			sizeBytes: upload.sizeBytes,
			sha256: upload.sha256,
			backupId: "b-1",
			durationMs: expect.any(Number),
			error: null,
		});
		expect(fs.existsSync(dirs[0])).toBe(false);
	});

	it("reports each stage in order, writing at most once a second within a stage", async () => {
		jest.spyOn(Date, "now").mockReturnValue(1_000_000);
		const { connectBackupService, setProgress } = await setup({
			dumpChunks: Array.from({ length: 20 }, () => crypto.randomBytes(20_000)),
		});

		await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		expect(setProgress.mock.calls.map(([progress]) => progress.stage)).toEqual(["dumping", "uploading", "saving"]);
	});

	it("records dump bytes and upload percent when time passes", async () => {
		let now = 1_000_000;
		jest.spyOn(Date, "now").mockImplementation(() => (now += 2_000));
		const { connectBackupService, setProgress } = await setup({
			dumpChunks: [crypto.randomBytes(20_000), crypto.randomBytes(20_000)],
		});

		await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		const progress = setProgress.mock.calls.map(([entry]) => entry);
		expect(progress.some((entry) => entry.stage === "dumping" && entry.bytes !== null)).toBe(true);
		expect(progress).toContainEqual({
			operation: "backup",
			stage: "uploading",
			percent: 100,
			bytes: null,
		});
	});

	it("returns a failure without uploading when mongodump fails", async () => {
		const { connectBackupService, connectApiService, logger } = await setup({
			dumpError: new Error("mongodump exited 1: auth failed"),
		});

		const result = await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		expect(result).toEqual({
			ok: false,
			at: expect.any(Date),
			kind: "full",
			sizeBytes: null,
			sha256: null,
			backupId: null,
			durationMs: null,
			error: "mongodump exited 1: auth failed",
		});
		expect(connectApiService.requestUpload).not.toHaveBeenCalled();
		expect(logger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "Connect backup failed");
	});

	it("releases the slot and keeps the original error when the upload fails", async () => {
		const { connectBackupService, connectApiService } = await setup({
			uploadError: new Error("blob upload failed (500)"),
		});

		const result = await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		expect(connectApiService.abandon).toHaveBeenCalledWith(ENROLLMENT, "b-1");
		expect(result).toMatchObject({
			ok: false,
			error: "blob upload failed (500)",
		});
	});

	it("releases the slot when completing fails", async () => {
		const { connectBackupService, connectApiService } = await setup({
			completeError: new Error("Checkmate Connect responded 500"),
		});

		const result = await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		expect(connectApiService.abandon).toHaveBeenCalledWith(ENROLLMENT, "b-1");
		expect(result).toMatchObject({
			ok: false,
			error: "Checkmate Connect responded 500",
		});
	});

	it("does not release a slot it never got", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.requestUpload.mockRejectedValue(new Error("Backup quota reached"));

		const result = await connectBackupService.backup({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			kind: "full",
		});

		expect(connectApiService.abandon).not.toHaveBeenCalled();
		expect(result).toMatchObject({ ok: false, error: "Backup quota reached" });
	});

	it("never throws when progress can't be written", async () => {
		const { connectBackupService, setProgress, logger } = await setup();
		setProgress.mockRejectedValue(new Error("db down"));

		await expect(
			connectBackupService.backup({
				enrollment: ENROLLMENT,
				recoveryKey: KEY,
				kind: "full",
			})
		).resolves.toMatchObject({ ok: true });
		expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Could not record Connect backup progress");
	});
});
