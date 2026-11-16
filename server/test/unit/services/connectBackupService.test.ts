import { afterEach, describe, expect, it, jest } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { ConnectBackupService } from "../../../src/domain/connect/connect-backup.service.ts";
import { encryptToFile, recoveryKeyId } from "../../../src/domain/connect/connect.backup-format.ts";
import type { IConnectBackupTools } from "../../../src/domain/connect/connect.backup-tools.ts";
import type { ConnectApiBackup } from "../../../src/domain/connect/connect-backup.type.ts";
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

	const withDir = async <T>(work: (dir: string, configFile: string) => Promise<T>): Promise<T> => {
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "connect-backup-"));
		dirs.push(dir);
		try {
			return await work(dir, path.join(dir, "mongo.yaml"));
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
	};

	const tools: IConnectBackupTools = {
		checkTools: async () => [],
		withWorkDir: withDir,
		withRestoreWorkDir: withDir,
		restore: jest.fn<any>().mockResolvedValue(undefined),
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
		download: jest.fn<any>(),
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

const sealTo = async (file: string, key: string) => {
	await encryptToFile(Readable.from([Buffer.from("archive")]), file, key, () => undefined);
};

const cloudBackup = (id: string, sizeBytes: number, keyId?: string): ConnectApiBackup => ({
	id,
	kind: "full",
	sizeBytes,
	status: "verified",
	createdAt: "2026-11-12T10:00:00.000Z",
	keyId,
});

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
			attempt: null,
			attempts: null,
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

describe("ConnectBackupService.restore", () => {
	it("downloads, decrypts and restores into the configured database", async () => {
		const { connectBackupService, connectApiService, tools, dirs, setProgress } = await setup();
		connectApiService.download.mockImplementation(async (_enrollment: unknown, _id: string, file: string) => sealTo(file, KEY));

		const result = await connectBackupService.restore({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			backupId: "b-9",
		});

		expect(connectApiService.download).toHaveBeenCalledWith(ENROLLMENT, "b-9", path.join(dirs[0], "restore.cmkb"), expect.any(Function));
		expect(tools.restore).toHaveBeenCalledWith(path.join(dirs[0], "mongo.yaml"), path.join(dirs[0], "restore.archive.gz"), "uptime_db");
		expect(result).toEqual({
			ok: true,
			at: expect.any(Date),
			kind: null,
			sizeBytes: null,
			sha256: null,
			backupId: "b-9",
			durationMs: expect.any(Number),
			error: null,
		});
		expect(setProgress.mock.calls.map(([progress]) => [progress.operation, progress.stage])).toEqual([
			["restore", "downloading"],
			["restore", "decrypting"],
			["restore", "restoring"],
		]);
		expect(fs.existsSync(dirs[0])).toBe(false);
	});

	it("refuses to restore an archive the key doesn't open", async () => {
		const { connectBackupService, connectApiService, tools } = await setup();
		connectApiService.download.mockImplementation(async (_enrollment: unknown, _id: string, file: string) => sealTo(file, "cd".repeat(32)));

		const result = await connectBackupService.restore({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			backupId: "b-9",
		});

		expect(tools.restore).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			ok: false,
			kind: null,
			backupId: "b-9",
			error: "decryption failed: wrong recovery key or corrupted archive",
		});
	});

	it("records a failed download without restoring", async () => {
		const { connectBackupService, connectApiService, tools, logger } = await setup();
		connectApiService.download.mockRejectedValue(new Error("downloaded archive does not match its recorded checksum"));

		const result = await connectBackupService.restore({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			backupId: "b-9",
		});

		expect(tools.restore).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			ok: false,
			error: "downloaded archive does not match its recorded checksum",
		});
		expect(logger.error).toHaveBeenCalledWith({ err: expect.any(Error), backupId: "b-9" }, "Connect restore failed");
	});

	it("records a failed mongorestore", async () => {
		const { connectBackupService, connectApiService, tools } = await setup();
		connectApiService.download.mockImplementation(async (_enrollment: unknown, _id: string, file: string) => sealTo(file, KEY));
		tools.restore = jest.fn<any>().mockRejectedValue(new Error("restore wrote no data"));

		const result = await connectBackupService.restore({
			enrollment: ENROLLMENT,
			recoveryKey: KEY,
			backupId: "b-9",
		});

		expect(result).toMatchObject({ ok: false, error: "restore wrote no data" });
	});
});

describe("ConnectBackupService.verify", () => {
	const OTHER = "cd".repeat(32);

	const withBlobs = (connectApiService: any, keys: Record<string, string>) => {
		connectApiService.download.mockImplementation(async (_enrollment: unknown, id: string, file: string) => sealTo(file, keys[id]));
	};

	it("reports when there is nothing to check against", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([]);

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("no-backups");
		expect(connectApiService.download).not.toHaveBeenCalled();
	});

	it("accepts the key that sealed the smallest backup, downloading only that one", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("big", 900), cloudBackup("small", 100)]);
		withBlobs(connectApiService, { big: KEY, small: KEY });

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("ok");
		expect(connectApiService.download.mock.calls.map(([, id]: any[]) => id)).toEqual(["small"]);
	});

	it("accepts a key that only opens a larger backup", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("small", 100), cloudBackup("big", 900)]);
		withBlobs(connectApiService, { small: OTHER, big: KEY });

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("ok");
		expect(connectApiService.download).toHaveBeenCalledTimes(2);
	});

	it("rejects a key that opens none of the backups", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("a", 100), cloudBackup("b", 200)]);
		withBlobs(connectApiService, { a: OTHER, b: OTHER });

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("wrong-key");
	});

	it("tries backups with a matching fingerprint first and skips other keys' backups", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([
			cloudBackup("old", 50),
			cloudBackup("theirs", 10, recoveryKeyId(OTHER)),
			cloudBackup("mine", 900, recoveryKeyId(KEY)),
		]);
		withBlobs(connectApiService, { old: OTHER, theirs: OTHER, mine: KEY });

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("ok");
		expect(connectApiService.download.mock.calls.map(([, id]: any[]) => id)).toEqual(["mine"]);
	});

	it("refuses a key that matches no fingerprint without downloading", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("theirs", 10, recoveryKeyId(OTHER))]);

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).resolves.toBe("wrong-key");
		expect(connectApiService.download).not.toHaveBeenCalled();
	});

	it("surfaces a broken download as an error, not a wrong key", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("a", 100)]);
		connectApiService.download.mockRejectedValue(new Error("blob download failed (500)"));

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).rejects.toThrow("blob download failed (500)");
	});

	it("surfaces a file that isn't a backup as an error", async () => {
		const { connectBackupService, connectApiService } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("a", 100)]);
		connectApiService.download.mockImplementation(async (_enrollment: unknown, _id: string, file: string) =>
			fs.promises.writeFile(file, Buffer.alloc(100))
		);

		await expect(connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY })).rejects.toThrow("not a CMKB1 backup");
	});

	it("reports which backup it is checking", async () => {
		jest.spyOn(Date, "now").mockReturnValue(1_000_000);
		const { connectBackupService, connectApiService, setProgress } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("a", 100), cloudBackup("b", 200)]);
		withBlobs(connectApiService, { a: OTHER, b: KEY });

		await connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY });

		expect(setProgress.mock.calls.map(([progress]) => [progress.operation, progress.stage, progress.attempt, progress.attempts])).toEqual([
			["verify", "downloading", null, null],
			["verify", "downloading", 1, 2],
			["verify", "decrypting", 1, 2],
			["verify", "downloading", 2, 2],
			["verify", "decrypting", 2, 2],
		]);
	});

	it("removes each work directory after checking", async () => {
		const { connectBackupService, connectApiService, dirs } = await setup();
		connectApiService.list.mockResolvedValue([cloudBackup("a", 100), cloudBackup("b", 200)]);
		withBlobs(connectApiService, { a: OTHER, b: OTHER });

		await connectBackupService.verify({ enrollment: ENROLLMENT, recoveryKey: KEY });

		expect(dirs).toHaveLength(2);
		expect(dirs.some((dir) => fs.existsSync(dir))).toBe(false);
	});
});
