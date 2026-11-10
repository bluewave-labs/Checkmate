import { afterEach, describe, expect, it, jest } from "@jest/globals";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Mongoose } from "mongoose";
import { ConnectService, DEFAULT_CONNECT_HOSTS, isConnectHostAllowed } from "../../../src/domain/connect/connect.service.ts";
import { ConnectHeartbeat } from "../../../src/domain/connect/connect.heartbeat.ts";
import { validateTunnelRequest } from "../../../src/domain/connect/connect.tunnel.ts";
import {
	ConnectBackup,
	buildDumpArgs,
	buildRestoreArgs,
	restoreConnectionUri,
	deriveBackupKey,
	isAllowedTransferUrl,
	recoveryKeyId,
	stallGuard,
} from "../../../src/domain/connect/connect.backup.ts";
import { ConnectBackupJob } from "../../../src/domain/connect/connect.backup-job.ts";
import {
	CONNECT_STATE_COLLECTION,
	emptyConnectState,
	type ConnectBackupResult,
	type ConnectState,
} from "../../../src/domain/connect/connect.type.ts";
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

const setup = (
	opts: {
		configured?: boolean;
		stored?: ConnectState | null;
		lastScheduled?: ConnectBackupResult;
		scheduledRunning?: boolean;
		load?: () => Promise<ConnectState | null>;
	} = {}
) => {
	const repository: jest.Mocked<IConnectRepository> = {
		load: jest.fn(opts.load ?? (async () => opts.stored ?? null)),
		save: jest.fn(async () => {}),
		loadLastScheduledBackup: jest.fn(async () => opts.lastScheduled ?? null),
		saveLastScheduledBackup: jest.fn(async () => {}),
	};
	const scheduler = {
		setConnectBackupJob: jest.fn(async () => {}),
		removeConnectBackupJob: jest.fn(async () => {}),
		isConnectBackupRunning: jest.fn(async () => opts.scheduledRunning ?? false),
	};
	const db = { getConnection: async () => ({ connection: { readyState: 1, name: "uptime_db" } }) } as unknown as IDb<Mongoose>;
	const service = new ConnectService({
		repository,
		scheduler,
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
	return { service, repository, scheduler };
};

describe("Connect", () => {
	const services: ConnectService[] = [];
	const ready = async (opts: Parameters<typeof setup>[0] = {}) => {
		const result = setup(opts);
		services.push(result.service);
		await result.service.start();
		return result;
	};
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
			expect(validateTunnelRequest(request({ headers }), LOCAL)?.headers).toEqual({
				authorization: "Bearer x",
				"x-checkmate-connect-tunnel": "1",
			});
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

		it("restores into the configured database, not the one in the archive", () => {
			const args = buildRestoreArgs("/tmp/x/mongo.yaml", "/tmp/x/a.archive", "renamed_db");
			expect(args).toContain("--nsFrom=$db$.$coll$");
			expect(args).toContain("--nsTo=renamed_db.$coll$");
			expect(args).toContain("--drop");
			expect(args.join(" ")).not.toContain("mongodb://");
		});

		it.each([
			["mongodb://localhost:27017/uptime_db", "mongodb://localhost:27017/"],
			["mongodb://localhost:27017/uptime_db?replicaSet=rs0", "mongodb://localhost:27017/?replicaSet=rs0"],
			["mongodb://u:p@db:27017/uptime_db", "mongodb://u:p@db:27017/?authSource=uptime_db"],
			["mongodb://u:p@db:27017/uptime_db?authSource=admin", "mongodb://u:p@db:27017/?authSource=admin"],
			["mongodb://u:p@a:1,b:2/uptime_db?tls=true", "mongodb://u:p@a:1,b:2/?tls=true&authSource=uptime_db"],
			["mongodb+srv://u:p@cluster.example/uptime_db", "mongodb+srv://u:p@cluster.example/?authSource=uptime_db"],
			["mongodb://localhost:27017", "mongodb://localhost:27017"],
			["mongodb://localhost:27017/?replicaSet=rs0", "mongodb://localhost:27017/?replicaSet=rs0"],
		])("removes the database from %s for restores", (input, expected) => {
			expect(restoreConnectionUri(input)).toBe(expected);
		});

		it("keeps the key derivation of existing CMKB1 backups", () => {
			const key = deriveBackupKey("00".repeat(32), Buffer.alloc(16));
			expect(key.toString("hex")).toBe("8889fac04828176b7e78fee78c1d0bd8aa6fd433913eb1b7f64e8474c55f0a36");
		});
	});

	describe("backup tool detection", () => {
		const makeBackup = () => {
			const logger = createMockLogger();
			// process.execPath is a real binary that exits 0 for --version.
			const options = {
				mongoUrl: "mongodb://localhost/uptime_db",
				getDbName: async () => "uptime_db",
				mongodumpBin: process.execPath,
				mongorestoreBin: process.execPath,
				apiBaseOverride: null,
				log: logger as unknown as ILogger,
			};
			return { backup: new ConnectBackup(options), options, logger };
		};

		it("reports nothing missing when both tools run", async () => {
			const { backup, logger } = makeBackup();
			await backup.checkTools();
			expect(backup.status().missingTools).toEqual([]);
			expect(logger.warn).not.toHaveBeenCalled();
		});

		it("names each tool that cannot run", async () => {
			const { backup, options } = makeBackup();
			options.mongorestoreBin = "/nonexistent/mongorestore";
			await backup.checkTools();
			expect(backup.status().missingTools).toEqual(["mongorestore"]);
			options.mongodumpBin = "";
			await backup.checkTools();
			expect(backup.status().missingTools).toEqual(["mongodump", "mongorestore"]);
		});

		it("warns once and clears after the tools are installed", async () => {
			const { backup, options, logger } = makeBackup();
			options.mongodumpBin = "/nonexistent/mongodump";
			await backup.checkTools();
			await backup.checkTools();
			expect(logger.warn).toHaveBeenCalledTimes(1);
			options.mongodumpBin = process.execPath;
			await backup.checkTools();
			expect(backup.status().missingTools).toEqual([]);
		});
	});

	describe("failed uploads", () => {
		const API = "https://connect.checkmate.so";
		const enrollment = { connectUrl: "wss://relay.checkmate.so/api/tunnel", agentId: "inst-1", token: TOKEN, apiUrl: API };
		let dir: string;

		const runBackup = async (uploadUrl: string, respond: (url: string) => Response) => {
			dir = fs.mkdtempSync(path.join(os.tmpdir(), "connect-test-"));
			const dump = path.join(dir, "mongodump");
			fs.writeFileSync(dump, "#!/bin/sh\necho archive\n", { mode: 0o755 });
			const calls: string[] = [];
			jest.spyOn(globalThis, "fetch").mockImplementation((async (input: string) => {
				const url = String(input);
				calls.push(url);
				if (url.endsWith("/request-upload")) return Response.json({ uploadUrl, backupId: "backup-1" });
				return respond(url);
			}) as unknown as typeof fetch);
			const backup = new ConnectBackup({
				mongoUrl: "mongodb://localhost/uptime_db",
				getDbName: async () => "uptime_db",
				mongodumpBin: dump,
				mongorestoreBin: dump,
				apiBaseOverride: null,
				log: createMockLogger() as unknown as ILogger,
			});
			backup.start({ enrollment, recoveryKeyHex: "00".repeat(32), kind: "config" });
			while (backup.status().running) await new Promise((resolve) => setTimeout(resolve, 10));
			fs.rmSync(dir, { recursive: true, force: true });
			return { calls, result: backup.status().lastResult };
		};
		const BLOB = "https://store.private.blob.vercel-storage.com/x";
		const ABANDON = `${API}/api/agent/backups/backup-1/abandon`;

		it("releases the slot when the upload is refused", async () => {
			const { calls, result } = await runBackup(BLOB, (url) => (url === BLOB ? new Response("", { status: 500 }) : Response.json({})));
			expect(calls).toContain(ABANDON);
			expect(result).toMatchObject({ ok: false, error: "blob upload failed (500)" });
		});

		it("releases the slot when the storage URL is not trusted", async () => {
			const { calls, result } = await runBackup("https://evil.example/x", () => Response.json({}));
			expect(calls).toEqual([`${API}/api/agent/backups/request-upload`, ABANDON]);
			expect(result).toMatchObject({ ok: false, error: "control plane returned an unexpected storage URL" });
		});

		it("keeps the original error when the release fails", async () => {
			const { result } = await runBackup(BLOB, (url) => {
				if (url === ABANDON) throw new Error("network down");
				return new Response("", { status: 503 });
			});
			expect(result).toMatchObject({ ok: false, error: "blob upload failed (503)" });
		});

		it("does not release a successful upload", async () => {
			const { calls, result } = await runBackup(BLOB, (url) => (url === BLOB ? new Response("") : Response.json({ status: "verified" })));
			expect(calls).not.toContain(ABANDON);
			expect(result).toMatchObject({ ok: true });
		});

		describe("verifyRecoveryKey", () => {
			const KEY = "ab".repeat(32);
			const sealed = (key: string) => {
				const salt = crypto.randomBytes(16);
				const nonce = crypto.randomBytes(12);
				const cipher = crypto.createCipheriv("aes-256-gcm", deriveBackupKey(key, salt), nonce);
				const body = Buffer.concat([cipher.update("archive"), cipher.final()]);
				return Buffer.concat([Buffer.from("CMKB1"), salt, nonce, body, cipher.getAuthTag()]);
			};
			const verify = async (backups: { id: string; sizeBytes: number }[], blobs: Buffer | Record<string, Buffer>, key = KEY) => {
				const downloads: string[] = [];
				let current = Buffer.alloc(0);
				jest.spyOn(globalThis, "fetch").mockImplementation((async (input: string) => {
					const url = String(input);
					if (url.includes("/api/agent/backups?agentId=")) return Response.json({ backups });
					if (url.endsWith("/download")) {
						downloads.push(url);
						const id = url.split("/").at(-2) as string;
						current = Buffer.isBuffer(blobs) ? blobs : blobs[id];
						return Response.json({
							downloadUrl: BLOB,
							sizeBytes: current.length,
							sha256: crypto.createHash("sha256").update(current).digest("hex"),
						});
					}
					return new Response(new Uint8Array(current));
				}) as unknown as typeof fetch);
				const backup = new ConnectBackup({
					mongoUrl: "mongodb://localhost/uptime_db",
					getDbName: async () => "uptime_db",
					mongodumpBin: "mongodump",
					mongorestoreBin: "mongorestore",
					apiBaseOverride: null,
					log: createMockLogger() as unknown as ILogger,
				});
				return { downloads, result: await backup.verifyRecoveryKey({ enrollment, recoveryKeyHex: key }), status: backup.status() };
			};

			it("accepts the key that sealed the smallest backup", async () => {
				const { result, downloads } = await verify(
					[
						{ id: "large", sizeBytes: 900 },
						{ id: "small", sizeBytes: 10 },
					],
					sealed(KEY)
				);
				expect(result).toBe("ok");
				expect(downloads).toEqual([`${API}/api/agent/backups/small/download`]);
			});

			it("rejects a different key", async () => {
				expect((await verify([{ id: "b", sizeBytes: 10 }], sealed(KEY), "cd".repeat(32))).result).toBe("wrong-key");
			});

			it("accepts a key that only opens a larger backup", async () => {
				const { result, downloads } = await verify(
					[
						{ id: "new-key", sizeBytes: 10 },
						{ id: "old-key", sizeBytes: 900 },
					],
					{ "new-key": sealed("cd".repeat(32)), "old-key": sealed(KEY) }
				);
				expect(result).toBe("ok");
				expect(downloads).toEqual([`${API}/api/agent/backups/new-key/download`, `${API}/api/agent/backups/old-key/download`]);
			});

			it("rejects a key that opens none of the backups", async () => {
				const { result, downloads } = await verify(
					[
						{ id: "a", sizeBytes: 10 },
						{ id: "b", sizeBytes: 20 },
					],
					sealed("cd".repeat(32))
				);
				expect(result).toBe("wrong-key");
				expect(downloads).toHaveLength(2);
			});

			it("skips backups whose fingerprint belongs to another key", async () => {
				const { result, downloads } = await verify(
					[
						{ id: "other", sizeBytes: 10, keyId: recoveryKeyId("cd".repeat(32)) },
						{ id: "mine", sizeBytes: 900, keyId: recoveryKeyId(KEY) },
					] as { id: string; sizeBytes: number }[],
					sealed(KEY)
				);
				expect(result).toBe("ok");
				expect(downloads).toEqual([`${API}/api/agent/backups/mine/download`]);
			});

			it("refuses a key that matches no fingerprint without downloading", async () => {
				const { result, downloads } = await verify(
					[{ id: "other", sizeBytes: 10, keyId: recoveryKeyId("cd".repeat(32)) }] as { id: string; sizeBytes: number }[],
					sealed(KEY)
				);
				expect(result).toBe("wrong-key");
				expect(downloads).toEqual([]);
			});

			it("derives a stable fingerprint that does not reveal the key", () => {
				expect(recoveryKeyId(KEY)).toBe(recoveryKeyId(KEY));
				expect(recoveryKeyId(KEY)).toMatch(/^[a-f0-9]{32}$/);
				expect(KEY).not.toContain(recoveryKeyId(KEY));
			});

			it("clears progress when the check ends", async () => {
				const { status } = await verify([{ id: "b", sizeBytes: 10 }], sealed(KEY));
				expect(status).toMatchObject({ verifying: false, progress: null });
			});

			it("reports when there is nothing to check against", async () => {
				expect((await verify([], sealed(KEY))).result).toBe("no-backups");
			});

			it("surfaces a corrupt file format as an error, not a wrong key", async () => {
				await expect(verify([{ id: "b", sizeBytes: 10 }], Buffer.alloc(80))).rejects.toThrow("not a CMKB1 backup");
			});
		});
	});

	describe("isAllowedTransferUrl", () => {
		it("accepts Vercel Blob's presigned upload endpoint", () => {
			expect(isAllowedTransferUrl("https://vercel.com/api/blob/?pathname=backups%2Finst-1%2Fid.cmkb", false)).toBe(true);
		});

		it.each([
			"http://vercel.com/api/blob/?pathname=x",
			"https://vercel.com/api/blobs/x",
			"https://vercel.com/account",
			"https://vercel.com.evil.example/api/blob/",
			"https://evil.example/api/blob/",
		])("refuses %s", (raw) => {
			expect(isAllowedTransferUrl(raw, false)).toBe(false);
		});

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

		it("refuses changes while state is still loading", async () => {
			const { service, repository } = setup();
			expect((await service.createRecoveryKey()).status).toBe(503);
			expect((await service.runBackup()).status).toBe(503);
			expect((await service.restoreBackup("id")).status).toBe(503);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("creates one recovery key when two requests race", async () => {
			jest.spyOn(globalThis, "fetch").mockImplementation((async () => new Response("{}")) as unknown as typeof fetch);
			const { service, repository } = await ready();
			await service.enroll(enrollInput);
			repository.save.mockClear();
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
			const { service, repository } = await ready();
			const result = await service.enroll({ ...enrollInput, connectUrl: "wss://evil.example/api/tunnel" });
			expect(result.status).toBe(400);
			expect(repository.save).not.toHaveBeenCalled();
		});

		it("encrypts the credential at rest and never returns it", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service, repository } = await ready();
			const result = await service.enroll(enrollInput);
			expect(repository.save.mock.calls[0]![0].enrollment?.token).toBe(`v1.key.${TOKEN}`);
			expect(JSON.stringify(result.data)).not.toContain(TOKEN);
			expect(JSON.stringify(service.getStatus().data)).not.toContain(TOKEN);
		});

		it("stores secrets unencrypted when no ENCRYPTION_KEY is configured", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service, repository } = await ready({ configured: false });
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
			const { service, repository } = await ready();
			repository.save.mockRejectedValueOnce(new Error("db down"));
			await expect(service.enroll(enrollInput)).rejects.toThrow("db down");
			expect(service.getStatus().data).toMatchObject({ enrolled: false });
		});

		it("requires enrollment for remote access", async () => {
			const { service } = await ready();
			expect((await service.setRemoteAccess(true)).status).toBe(409);
		});

		it("generates the recovery key once", async () => {
			jest.spyOn(globalThis, "fetch").mockImplementation((async () => new Response("{}")) as unknown as typeof fetch);
			const { service } = await ready();
			await service.enroll(enrollInput);
			const first = await service.createRecoveryKey();
			expect(first.data.recoveryKey).toMatch(/^[a-f0-9]{64}$/);
			expect((await service.createRecoveryKey()).status).toBe(409);
		});

		describe("createRecoveryKey with cloud backups", () => {
			const enrolledWithList = async (list: () => Promise<unknown>) => {
				jest.spyOn(globalThis, "fetch").mockImplementation((async () => new Response("{}")) as unknown as typeof fetch);
				const context = await ready();
				await context.service.enroll(enrollInput);
				const listBackups = jest.fn(list);
				(context.service as unknown as { backups: { list: unknown } }).backups.list = listBackups;
				return { ...context, listBackups };
			};
			const keySet = (service: ConnectService) => (service.getStatus().data.backup as { recoveryKeySet: boolean }).recoveryKeySet;

			it("refuses while backups exist", async () => {
				const { service } = await enrolledWithList(async () => ({ backups: [{ id: "b" }] }));
				expect((await service.createRecoveryKey()).status).toBe(409);
				expect(keySet(service)).toBe(false);
			});

			it("generates when the account has no backups", async () => {
				const { service } = await enrolledWithList(async () => ({ backups: [] }));
				expect((await service.createRecoveryKey()).status).toBe(200);
				expect(keySet(service)).toBe(true);
			});

			it("fails closed when backups cannot be listed", async () => {
				const { service } = await enrolledWithList(async () => {
					throw new Error("network down");
				});
				expect(await service.createRecoveryKey()).toEqual({ status: 502, data: { error: "network down" } });
				expect(keySet(service)).toBe(false);
			});

			it("generates over existing backups only when told to discard them", async () => {
				const { service, listBackups } = await enrolledWithList(async () => ({ backups: [{ id: "b" }] }));
				expect((await service.createRecoveryKey({ discardExisting: true })).status).toBe(200);
				expect(listBackups).not.toHaveBeenCalled();
			});

			it("requires enrollment", async () => {
				const { service } = await ready();
				expect((await service.createRecoveryKey()).status).toBe(409);
			});
		});

		describe("importRecoveryKey", () => {
			const KEY = "ab".repeat(32);
			const enrolledWithCheck = async (check: () => Promise<string>) => {
				jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
				const context = await ready();
				await context.service.enroll(enrollInput);
				const verifyRecoveryKey = jest.fn(check);
				(context.service as unknown as { backups: { verifyRecoveryKey: unknown } }).backups.verifyRecoveryKey = verifyRecoveryKey;
				return { ...context, verifyRecoveryKey };
			};

			it("saves a verified key and does not echo it", async () => {
				const { service } = await enrolledWithCheck(async () => "ok");
				const result = await service.importRecoveryKey(KEY);
				expect(result.status).toBe(200);
				expect(JSON.stringify(result.data)).not.toContain(KEY);
				expect(service.getStatus().data).toMatchObject({ backup: { recoveryKeySet: true } });
			});

			it.each([
				["wrong-key", 422],
				["no-backups", 409],
				["busy", 409],
			])("does not save the key on %s", async (check, status) => {
				const { service } = await enrolledWithCheck(async () => check);
				expect((await service.importRecoveryKey(KEY)).status).toBe(status);
				expect(service.getStatus().data).toMatchObject({ backup: { recoveryKeySet: false } });
			});

			it("returns 502 when the check cannot run", async () => {
				const { service } = await enrolledWithCheck(async () => {
					throw new Error("network down");
				});
				expect(await service.importRecoveryKey(KEY)).toEqual({ status: 502, data: { error: "network down" } });
			});

			it("does not replace an existing key unless asked", async () => {
				const { service, verifyRecoveryKey } = await enrolledWithCheck(async () => "ok");
				await service.createRecoveryKey();
				expect((await service.importRecoveryKey(KEY)).status).toBe(409);
				expect(verifyRecoveryKey).not.toHaveBeenCalled();
			});

			describe("replacing a saved key", () => {
				const savedKey = (service: unknown) => (service as { state: { recoveryKey: string | null } }).state.recoveryKey;

				it("switches to a key that decrypts a stored backup", async () => {
					const { service } = await enrolledWithCheck(async () => "ok");
					await service.createRecoveryKey();
					expect((await service.importRecoveryKey(KEY, { replaceExisting: true })).status).toBe(200);
					expect(savedKey(service)).toBe(KEY);
				});

				it.each([
					["wrong-key", 422],
					["no-backups", 409],
					["busy", 409],
				])("keeps the saved key on %s", async (check, status) => {
					const { service } = await enrolledWithCheck(async () => check);
					await service.createRecoveryKey();
					const before = savedKey(service);
					expect((await service.importRecoveryKey(KEY, { replaceExisting: true })).status).toBe(status);
					expect(savedKey(service)).toBe(before);
				});

				it("refuses the key that is already saved without checking backups", async () => {
					const { service, verifyRecoveryKey } = await enrolledWithCheck(async () => "ok");
					await service.createRecoveryKey();
					expect((await service.importRecoveryKey(savedKey(service) as string, { replaceExisting: true })).status).toBe(409);
					expect(verifyRecoveryKey).not.toHaveBeenCalled();
				});
			});

			it("requires enrollment", async () => {
				const { service } = await ready();
				expect((await service.importRecoveryKey(KEY)).status).toBe(409);
			});
		});

		it("keeps the recovery key after unenrolling", async () => {
			jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
			const { service } = await ready();
			await service.enroll(enrollInput);
			await service.createRecoveryKey();
			await service.unenroll();
			expect(service.getStatus().data).toMatchObject({ enrolled: false, backup: { recoveryKeySet: true } });
		});

		describe("scheduled backups", () => {
			const scheduled = async (opts: Parameters<typeof setup>[0] = {}) => {
				jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ backups: [] })));
				const context = setup(opts);
				services.push(context.service);
				await context.service.start();
				await context.service.enroll(enrollInput);
				await context.service.createRecoveryKey();
				context.scheduler.setConnectBackupJob.mockClear();
				context.scheduler.removeConnectBackupJob.mockClear();
				return context;
			};

			it("creates a job when the schedule is turned on", async () => {
				const { service, scheduler } = await scheduled();
				await service.setBackupSchedule({ enabled: true, intervalHours: 6 });
				expect(scheduler.setConnectBackupJob).toHaveBeenCalledWith(6 * 3_600_000, undefined);
			});

			it("moves the next run when the interval changes", async () => {
				const { service, scheduler } = await scheduled();
				await service.setBackupSchedule({ enabled: true, intervalHours: 168 });
				const before = Date.now();
				await service.setBackupSchedule({ enabled: true, intervalHours: 6 });
				const nextRun = scheduler.setConnectBackupJob.mock.calls[1] as unknown as [number, number];
				expect(nextRun[1]).toBeGreaterThanOrEqual(before + 6 * 3_600_000);
			});

			it("leaves the next run alone when only the kind changes", async () => {
				const { service, scheduler } = await scheduled();
				await service.setBackupSchedule({ enabled: true, intervalHours: 6, kind: "full" });
				await service.setBackupSchedule({ enabled: true, intervalHours: 6, kind: "config" });
				expect(scheduler.setConnectBackupJob.mock.calls[1]).toEqual([6 * 3_600_000, undefined]);
			});

			it("removes the job when the schedule is turned off", async () => {
				const { service, scheduler } = await scheduled();
				await service.setBackupSchedule({ enabled: false });
				expect(scheduler.removeConnectBackupJob).toHaveBeenCalled();
			});

			it("restores the job at startup without forcing a run", async () => {
				const { service, scheduler } = setup({
					stored: {
						...emptyConnectState(),
						enrollment: { connectUrl: enrollInput.connectUrl, agentId: enrollInput.agentId, token: enrollInput.token, apiUrl: null },
						recoveryKey: "ab".repeat(32),
						schedule: { enabled: true, intervalHours: 24, kind: "full" },
					},
				});
				jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
				services.push(service);
				await service.start();
				expect(scheduler.setConnectBackupJob).toHaveBeenCalledWith(24 * 3_600_000);
			});

			it("keeps startup alive when the job cannot be written", async () => {
				const context = setup();
				context.scheduler.removeConnectBackupJob.mockRejectedValue(new Error("db down"));
				services.push(context.service);
				await expect(context.service.start()).resolves.toBeUndefined();
			});

			it.each(["runBackup", "restoreBackup"] as const)("refuses %s while a scheduled backup runs", async (action) => {
				const { service } = await scheduled({ scheduledRunning: true });
				expect(await service[action]("full")).toEqual({ status: 409, data: { error: "A scheduled backup is running" } });
			});

			it("reports a result recorded by another node", async () => {
				const at = new Date().toISOString();
				const { service } = await scheduled({ lastScheduled: { ok: true, at, kind: "full" }, scheduledRunning: true });
				expect((await service.getBackupStatus()).data).toMatchObject({ lastResult: { ok: true, at }, scheduledRunning: true });
			});
		});

		describe("ConnectBackupJob", () => {
			const KEY = "ab".repeat(32);
			const enrolled = {
				...emptyConnectState(),
				enrollment: { connectUrl: "wss://relay.checkmate.so/api/tunnel", agentId: "inst-1", token: "v1.key.tok", apiUrl: null },
				recoveryKey: `v1.key.${KEY}`,
				schedule: { enabled: true, intervalHours: 24, kind: "config" as const },
			};
			const build = (stored: ConnectState | null, runAndWait: () => Promise<unknown>) => {
				const repository = {
					load: jest.fn(async () => stored),
					saveLastScheduledBackup: jest.fn(async () => {}),
				};
				const backups = { runAndWait: jest.fn(runAndWait) };
				const job = new ConnectBackupJob({
					repository: repository as unknown as IConnectRepository,
					encryptionService: makeEncryption(true),
					backups: backups as unknown as ConstructorParameters<typeof ConnectBackupJob>[0]["backups"],
					log: createMockLogger() as unknown as ILogger,
				});
				return { job, repository, backups };
			};

			it("runs with decrypted secrets and records the result", async () => {
				const result = { ok: true, at: "2026-11-09T00:00:00.000Z" };
				const { job, repository, backups } = build(enrolled, async () => result);
				await job.handle();
				expect(backups.runAndWait).toHaveBeenCalledWith({
					enrollment: { ...enrolled.enrollment, token: "tok" },
					recoveryKeyHex: KEY,
					kind: "config",
				});
				expect(repository.saveLastScheduledBackup).toHaveBeenCalledWith(result);
			});

			it.each([
				["the schedule is off", { ...enrolled, schedule: { ...enrolled.schedule, enabled: false } }],
				["the server is not enrolled", { ...enrolled, enrollment: null }],
				["no key is saved", { ...enrolled, recoveryKey: null }],
				["no state exists", null],
			])("does nothing when %s", async (_name, stored) => {
				const { job, backups } = build(stored, async () => ({}));
				await job.handle();
				expect(backups.runAndWait).not.toHaveBeenCalled();
			});

			it("records a failure instead of throwing, so the queue waits for the next interval", async () => {
				const { job, repository } = build(enrolled, async () => {
					throw new Error("boom");
				});
				await expect(job.handle()).resolves.toBeUndefined();
				expect(repository.saveLastScheduledBackup).toHaveBeenCalledWith(expect.objectContaining({ ok: false, error: "boom" }));
			});

			it("records nothing when a backup is already running on this node", async () => {
				const { job, repository } = build(enrolled, async () => null);
				await job.handle();
				expect(repository.saveLastScheduledBackup).not.toHaveBeenCalled();
			});
		});

		it("refuses scheduled backups without a recovery key", async () => {
			const { service } = await ready();
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

	describe("stallGuard", () => {
		afterEach(() => {
			jest.useRealTimers();
		});

		it("never aborts a slow transfer that keeps moving, however long it runs", () => {
			jest.useFakeTimers();
			const guard = stallGuard(1000);
			for (let i = 0; i < 100; i++) {
				jest.advanceTimersByTime(900);
				guard.progress();
			}
			expect(guard.signal.aborted).toBe(false);
			guard.stop();
		});

		it("aborts once no data has moved for the stall window", () => {
			jest.useFakeTimers();
			const guard = stallGuard(1000);
			jest.advanceTimersByTime(900);
			guard.progress();
			jest.advanceTimersByTime(999);
			expect(guard.signal.aborted).toBe(false);
			jest.advanceTimersByTime(1);
			expect(guard.signal.aborted).toBe(true);
			expect(String(guard.signal.reason)).toContain("transfer stalled");
		});

		it("does not abort after stop", () => {
			jest.useFakeTimers();
			const guard = stallGuard(1000);
			guard.stop();
			jest.advanceTimersByTime(5000);
			expect(guard.signal.aborted).toBe(false);
		});
	});
});
