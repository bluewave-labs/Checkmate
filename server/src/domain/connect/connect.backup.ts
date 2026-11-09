import { execFile, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import type { ILogger } from "@/utils/logger/logger.js";
import { CONNECT_STATE_COLLECTION, type ConnectBackupKind, type ConnectEnrollment } from "@/domain/connect/connect.type.js";

// Encrypted cloud backup. mongodump --archive --gzip is streamed through
// AES-256-GCM into a temp file, then uploaded via a short-lived presigned URL.
// The cloud never sees plaintext or the recovery key.
//
// Format v1 ("CMKB1"): magic(5) | salt(16) | nonce(12) | ciphertext | gcmTag(16).
// Per-backup key = HKDF-SHA256(recoveryKey, salt, info). The recovery key is 32
// random bytes, so HKDF alone is the correct KDF.
const MAGIC = Buffer.from("CMKB1");
const INFO = "checkmate-connect-backup-v1";
const HEADER_LEN = 5 + 16 + 12;
const TAG_LEN = 16;
const CONTROL_PLANE_TIMEOUT_MS = 15_000;
const TRANSFER_TIMEOUT_MS = 60 * 60 * 1000;
const MAX_BACKUP_BYTES = 50 * 1024 ** 3;
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com";
// Vercel Blob issues presigned uploads on its API, and downloads on the store host.
const BLOB_API_HOST = "vercel.com";
const BLOB_API_PATH = "/api/blob";

// Config backups skip high-churn operational data so frequent schedules stay
// small; monitors, users, teams, settings and status pages are kept.
const CONFIG_EXCLUDED_COLLECTIONS = ["checks", "monitorstats", "geochecks", "dockerlogs", "dlqitems", "jobs"];

export const deriveBackupKey = (recoveryKeyHex: string, salt: Buffer) =>
	Buffer.from(crypto.hkdfSync("sha256", Buffer.from(recoveryKeyHex, "hex"), salt, INFO, 32));

export const buildDumpArgs = (configFile: string, dbName: string, kind: ConnectBackupKind) => {
	const excluded = [CONNECT_STATE_COLLECTION, ...(kind === "config" ? CONFIG_EXCLUDED_COLLECTIONS : [])];
	return [`--config=${configFile}`, "--archive", "--gzip", `--db=${dbName}`, ...excluded.map((name) => `--excludeCollection=${name}`)];
};

const RESTORED_NOTHING = /(^|\s)0 document\(s\) restored successfully/;

// A database in the URI makes mongorestore keep only that name from the archive,
// which restores nothing once the name differs. Credentials in such a URI
// authenticate against that database, so the name moves to authSource.
export const restoreConnectionUri = (mongoUrl: string) => {
	const match = mongoUrl.match(/^(mongodb(?:\+srv)?:\/\/[^/?]*)(?:\/([^?]*))?(?:\?(.*))?$/);
	if (!match) return mongoUrl;
	const [, base, database, query] = match;
	if (!base || !database) return mongoUrl;
	const params = query ? query.split("&") : [];
	if (base.includes("@") && !params.some((param) => param.toLowerCase().startsWith("authsource="))) {
		params.push(`authSource=${database}`);
	}
	return params.length > 0 ? `${base}/?${params.join("&")}` : `${base}/`;
};

export const buildRestoreArgs = (configFile: string, archiveFile: string, dbName: string) => [
	`--config=${configFile}`,
	`--archive=${archiveFile}`,
	"--gzip",
	"--drop",
	// A backup holds the database name it was taken from. Without this mapping
	// mongorestore writes there, whatever database Checkmate is configured to use.
	"--nsFrom=$db$.$coll$",
	`--nsTo=${dbName}.$coll$`,
];

// Transfer URLs come from the control plane, which must not be able to point
// this server at an internal address. CONNECT_API_URL deployments use their own
// storage, so the operator setting that variable accepts its URLs.
export const isAllowedTransferUrl = (raw: string, operatorOverride: boolean) => {
	try {
		const url = new URL(raw);
		if (operatorOverride) return url.protocol === "https:" || url.protocol === "http:";
		if (url.protocol !== "https:") return false;
		if (url.hostname.endsWith(BLOB_HOST_SUFFIX)) return true;
		return url.hostname === BLOB_API_HOST && (url.pathname === BLOB_API_PATH || url.pathname.startsWith(`${BLOB_API_PATH}/`));
	} catch {
		return false;
	}
};

type BackupOptions = {
	mongoUrl: string;
	getDbName: () => Promise<string>;
	mongodumpBin: string;
	mongorestoreBin: string;
	apiBaseOverride: string | null;
	log: ILogger;
};

type BackupRun = { enrollment: ConnectEnrollment; recoveryKeyHex: string };
type BackupResult = Record<string, unknown> & { ok: boolean; at: string };

export type RecoveryKeyCheck = "ok" | "wrong-key" | "no-backups" | "busy";

export type ConnectProgress = {
	operation: "backup" | "restore" | "verify";
	stage: "dumping" | "uploading" | "saving" | "downloading" | "decrypting" | "restoring";
	percent: number | null;
	bytes: number | null;
	attempt: number | null;
	attempts: number | null;
};

const toPercent = (done: number, total: number) => Math.min(100, Math.floor((done / total) * 100));

class WrongRecoveryKeyError extends Error {
	constructor() {
		super("decryption failed: wrong recovery key or corrupted archive");
	}
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "unknown error");

const postJson = async <T>(url: string, body: unknown, token: string): Promise<T> => {
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(CONTROL_PLANE_TIMEOUT_MS),
		// The control-plane host was allowlisted at enrollment; a redirect could
		// walk the credential off that host.
		redirect: "error",
	});
	const data = (await response.json().catch(() => ({}))) as T & { error?: string };
	if (!response.ok) throw new Error(data.error ?? `control plane responded ${response.status}`);
	return data;
};

const TOOL_CHECK_TIMEOUT_MS = 10_000;

const isRunnable = (bin: string) =>
	new Promise<boolean>((resolve) => {
		try {
			execFile(bin, ["--version"], { timeout: TOOL_CHECK_TIMEOUT_MS }, (error) => resolve(!error));
		} catch {
			resolve(false);
		}
	});

export class ConnectBackup {
	private running = false;
	private restoring = false;
	private verifying = false;
	private lastResult: BackupResult | null = null;
	private lastRestore: BackupResult | null = null;
	private missingTools: string[] = [];
	private progress: ConnectProgress | null = null;

	constructor(private options: BackupOptions) {}

	private isBusy = () => this.running || this.restoring || this.verifying;

	private beginProgress = (operation: ConnectProgress["operation"], stage: ConnectProgress["stage"]) => {
		this.progress = { operation, stage, percent: null, bytes: null, attempt: null, attempts: null };
	};

	private setStage = (stage: ConnectProgress["stage"]) => {
		if (this.progress) this.progress = { ...this.progress, stage, percent: null, bytes: null };
	};

	private updateProgress = (update: Partial<Omit<ConnectProgress, "operation" | "stage">>) => {
		if (this.progress) this.progress = { ...this.progress, ...update };
	};

	status = () => ({
		running: this.running,
		restoring: this.restoring,
		verifying: this.verifying,
		progress: this.progress,
		lastResult: this.lastResult,
		lastRestore: this.lastRestore,
		missingTools: this.missingTools,
	});

	// The official image ships these tools but a source install may not, so the
	// settings page needs to know before anyone clicks a backup button.
	checkTools = async () => {
		const [hasDump, hasRestore] = await Promise.all([isRunnable(this.options.mongodumpBin), isRunnable(this.options.mongorestoreBin)]);
		const missing = [...(hasDump ? [] : ["mongodump"]), ...(hasRestore ? [] : ["mongorestore"])];
		if (missing.length > 0 && missing.join() !== this.missingTools.join()) {
			this.options.log.warn({ missing }, "Connect cloud backups are unavailable until these tools are installed");
		}
		this.missingTools = missing;
	};

	private apiBase = (enrollment: ConnectEnrollment) => {
		if (this.options.apiBaseOverride) return this.options.apiBaseOverride;
		if (enrollment.apiUrl) return enrollment.apiUrl;
		return `https://${new URL(enrollment.connectUrl.replace(/^wss:/, "https:")).host}`;
	};

	private assertTransferUrl = (raw: string) => {
		if (!isAllowedTransferUrl(raw, this.options.apiBaseOverride !== null)) {
			throw new Error("control plane returned an unexpected storage URL");
		}
	};

	// Runs in a private temp directory: the database URI goes in a config file
	// there because command-line arguments are visible to the whole system.
	private withWorkDir = async <T>(work: (dir: string, configFile: string) => Promise<T>, mongoUrl = this.options.mongoUrl) => {
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "checkmate-connect-"));
		try {
			const configFile = path.join(dir, "mongo.yaml");
			await fs.promises.writeFile(configFile, `uri: ${JSON.stringify(mongoUrl)}\n`, { mode: 0o600 });
			return await work(dir, configFile);
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
	};

	start = ({ enrollment, recoveryKeyHex, kind }: BackupRun & { kind: ConnectBackupKind }) => {
		if (this.isBusy()) {
			return { started: false, error: "a backup or restore is already running" };
		}
		this.running = true;
		this.beginProgress("backup", "dumping");
		this.run(enrollment, recoveryKeyHex, kind)
			.then((result) => {
				this.lastResult = result;
			})
			.catch((error: unknown) => {
				this.lastResult = { ok: false, at: new Date().toISOString(), kind, error: errorMessage(error) };
				this.options.log.error({ err: error }, "Connect backup failed");
			})
			.finally(() => {
				this.running = false;
				this.progress = null;
			});
		return { started: true };
	};

	private run = (enrollment: ConnectEnrollment, recoveryKeyHex: string, kind: ConnectBackupKind) =>
		this.withWorkDir(async (dir, configFile): Promise<BackupResult> => {
			const startedAt = Date.now();
			const archive = path.join(dir, "backup.cmkb");
			const { sizeBytes, sha256 } = await this.dumpEncrypted(archive, configFile, recoveryKeyHex, kind);
			this.options.log.info({ kind, sizeBytes }, "Connect backup archive encrypted");

			const api = this.apiBase(enrollment);
			const ticket = await postJson<{ uploadUrl: string; backupId: string }>(
				`${api}/api/agent/backups/request-upload`,
				{ agentId: enrollment.agentId, kind, sizeBytes, sha256 },
				enrollment.token
			);

			try {
				this.assertTransferUrl(ticket.uploadUrl);
				this.setStage("uploading");
				const upload = await fetch(ticket.uploadUrl, {
					method: "PUT",
					headers: { "content-length": String(sizeBytes), "content-type": "application/octet-stream" },
					body: Readable.toWeb(Readable.from(this.meteredRead(archive, sizeBytes), { objectMode: false })) as unknown as BodyInit,
					duplex: "half",
					redirect: "error",
					signal: AbortSignal.timeout(TRANSFER_TIMEOUT_MS),
				} as RequestInit);
				if (!upload.ok) throw new Error(`blob upload failed (${upload.status})`);

				this.setStage("saving");
				const done = await postJson<{ status: string }>(`${api}/api/agent/backups/${ticket.backupId}/complete`, {}, enrollment.token);
				this.options.log.info({ backupId: ticket.backupId, status: done.status }, "Connect backup stored");
				return {
					ok: true,
					at: new Date().toISOString(),
					kind,
					sizeBytes,
					sha256,
					backupId: ticket.backupId,
					durationMs: Date.now() - startedAt,
				};
			} catch (error) {
				await this.releaseUpload(api, ticket.backupId, enrollment.token);
				throw error;
			}
		});

	private async *meteredRead(file: string, totalBytes: number) {
		let sent = 0;
		for await (const chunk of fs.createReadStream(file)) {
			sent += (chunk as Buffer).length;
			this.updateProgress({ percent: toPercent(sent, totalBytes) });
			yield chunk as Buffer;
		}
	}

	// Best effort: without this the slot frees itself once the service's stale
	// sweep runs, so a failure here must not replace the original error.
	private releaseUpload = async (api: string, backupId: string, token: string) => {
		try {
			await postJson(`${api}/api/agent/backups/${backupId}/abandon`, {}, token);
		} catch (error) {
			this.options.log.warn({ err: error, backupId }, "Connect could not release the failed upload");
		}
	};

	private dumpEncrypted = async (archive: string, configFile: string, recoveryKeyHex: string, kind: ConnectBackupKind) => {
		const args = buildDumpArgs(configFile, await this.options.getDbName(), kind);
		return new Promise<{ sizeBytes: number; sha256: string }>((resolve, reject) => {
			const salt = crypto.randomBytes(16);
			const nonce = crypto.randomBytes(12);
			const cipher = crypto.createCipheriv("aes-256-gcm", deriveBackupKey(recoveryKeyHex, salt), nonce);
			const out = fs.createWriteStream(archive, { mode: 0o600 });
			const hash = crypto.createHash("sha256");
			let sizeBytes = 0;

			const dump = spawn(this.options.mongodumpBin, args, { stdio: ["ignore", "pipe", "pipe"] });
			let stderr = "";
			dump.stderr.on("data", (chunk: Buffer) => {
				stderr = (stderr + chunk.toString()).slice(-2000);
			});
			dump.on("error", (error) => reject(new Error(`mongodump not available: ${error.message}`)));

			const header = Buffer.concat([MAGIC, salt, nonce]);
			hash.update(header);
			sizeBytes += header.length;
			out.write(header);

			cipher.on("data", (chunk: Buffer) => {
				hash.update(chunk);
				sizeBytes += chunk.length;
				this.updateProgress({ bytes: sizeBytes });
			});

			// stdout can end before the process has exited.
			const exited = new Promise<number | null>((done) => dump.on("close", done));

			Promise.all([pipeline(dump.stdout, cipher, out), exited])
				.then(([, exitCode]) => {
					if (exitCode !== 0) {
						reject(new Error(`mongodump exited ${exitCode}: ${stderr.trim()}`));
						return;
					}
					// The GCM tag only exists once the stream has ended.
					const tag = cipher.getAuthTag();
					hash.update(tag);
					sizeBytes += tag.length;
					fs.appendFileSync(archive, tag);
					resolve({ sizeBytes, sha256: hash.digest("hex") });
				})
				.catch(reject);
		});
	};

	// Fetched with the machine credential so the UI can offer restores without
	// a separate cloud session.
	list = async (enrollment: ConnectEnrollment) => {
		const response = await fetch(`${this.apiBase(enrollment)}/api/agent/backups?agentId=${encodeURIComponent(enrollment.agentId)}`, {
			headers: { authorization: `Bearer ${enrollment.token}` },
			signal: AbortSignal.timeout(CONTROL_PLANE_TIMEOUT_MS),
			redirect: "error",
		});
		const data = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
		if (!response.ok) throw new Error(data.error ?? `control plane responded ${response.status}`);
		return data;
	};

	// Verifies the checksum and GCM tag before anything touches the database.
	startRestore = ({ enrollment, recoveryKeyHex, backupId }: BackupRun & { backupId: string }) => {
		if (this.isBusy()) {
			return { started: false, error: "a backup or restore is already running" };
		}
		this.restoring = true;
		this.beginProgress("restore", "downloading");
		this.restore(enrollment, recoveryKeyHex, backupId)
			.then((result) => {
				this.lastRestore = result;
			})
			.catch((error: unknown) => {
				this.lastRestore = { ok: false, at: new Date().toISOString(), backupId, error: errorMessage(error) };
				this.options.log.error({ err: error }, "Connect restore failed");
			})
			.finally(() => {
				this.restoring = false;
				this.progress = null;
			});
		return { started: true };
	};

	// Decrypts stored backups, smallest first, without touching the database. A
	// key passes as soon as one decrypts: after "I lost my key", backups made with
	// the old and new keys can sit side by side.
	verifyRecoveryKey = async ({ enrollment, recoveryKeyHex }: BackupRun): Promise<RecoveryKeyCheck> => {
		if (this.isBusy()) return "busy";
		this.verifying = true;
		this.beginProgress("verify", "downloading");
		try {
			const { backups } = (await this.list(enrollment)) as { backups?: { id: string; sizeBytes: number }[] };
			const candidates = [...(backups ?? [])].sort((a, b) => a.sizeBytes - b.sizeBytes);
			if (candidates.length === 0) return "no-backups";
			for (const [index, candidate] of candidates.entries()) {
				this.updateProgress({ attempt: index + 1, attempts: candidates.length });
				try {
					await this.withWorkDir(async (dir) => {
						const encrypted = await this.download(enrollment, candidate.id, dir);
						this.setStage("decrypting");
						await this.decryptFile(encrypted, path.join(dir, "verify.archive.gz"), recoveryKeyHex);
					});
					return "ok";
				} catch (error) {
					if (!(error instanceof WrongRecoveryKeyError)) throw error;
				}
			}
			return "wrong-key";
		} finally {
			this.verifying = false;
			this.progress = null;
		}
	};

	// Returns the path of the downloaded file once its size and checksum match.
	private download = async (enrollment: ConnectEnrollment, backupId: string, dir: string) => {
		this.setStage("downloading");
		const reportProgress = this.updateProgress;
		const encrypted = path.join(dir, "restore.cmkb");
		const ticket = await postJson<{ downloadUrl: string; sha256: string; sizeBytes: number }>(
			`${this.apiBase(enrollment)}/api/agent/backups/${backupId}/download`,
			{ agentId: enrollment.agentId },
			enrollment.token
		);

		this.assertTransferUrl(ticket.downloadUrl);
		if (!Number.isSafeInteger(ticket.sizeBytes) || ticket.sizeBytes <= 0 || ticket.sizeBytes > MAX_BACKUP_BYTES) {
			throw new Error("control plane returned an invalid backup size");
		}
		const download = await fetch(ticket.downloadUrl, {
			redirect: "error",
			signal: AbortSignal.timeout(TRANSFER_TIMEOUT_MS),
		});
		if (!download.ok || !download.body) throw new Error(`blob download failed (${download.status})`);

		const hash = crypto.createHash("sha256");
		let received = 0;
		// Stops before the disk fills if the download exceeds its recorded size.
		const meter = new Transform({
			transform(chunk: Buffer, _encoding, callback) {
				received += chunk.length;
				if (received > ticket.sizeBytes) {
					callback(new Error(`download exceeds recorded size ${ticket.sizeBytes}`));
					return;
				}
				hash.update(chunk);
				reportProgress({ percent: toPercent(received, ticket.sizeBytes) });
				callback(null, chunk);
			},
		});
		await pipeline(Readable.fromWeb(download.body as WebReadableStream), meter, fs.createWriteStream(encrypted, { mode: 0o600 }));

		if (received !== ticket.sizeBytes) throw new Error(`downloaded size ${received} != recorded ${ticket.sizeBytes}`);
		if (hash.digest("hex") !== ticket.sha256) {
			throw new Error("downloaded archive does not match its recorded checksum");
		}
		return encrypted;
	};

	private restore = (enrollment: ConnectEnrollment, recoveryKeyHex: string, backupId: string) =>
		this.withWorkDir(async (dir, configFile): Promise<BackupResult> => {
			const startedAt = Date.now();
			const archive = path.join(dir, "restore.archive.gz");
			const encrypted = await this.download(enrollment, backupId, dir);

			this.setStage("decrypting");
			await this.decryptFile(encrypted, archive, recoveryKeyHex);
			this.setStage("restoring");
			await this.mongorestore(configFile, archive, await this.options.getDbName());
			this.options.log.info({ backupId }, "Connect restore completed");
			return { ok: true, at: new Date().toISOString(), backupId, durationMs: Date.now() - startedAt };
		}, restoreConnectionUri(this.options.mongoUrl));

	private decryptFile = async (inFile: string, outFile: string, recoveryKeyHex: string) => {
		const size = fs.statSync(inFile).size;
		if (size < HEADER_LEN + TAG_LEN) throw new Error("backup file too short");

		const fd = fs.openSync(inFile, "r");
		const header = Buffer.alloc(HEADER_LEN);
		const tag = Buffer.alloc(TAG_LEN);
		try {
			fs.readSync(fd, header, 0, HEADER_LEN, 0);
			fs.readSync(fd, tag, 0, TAG_LEN, size - TAG_LEN);
		} finally {
			fs.closeSync(fd);
		}
		if (!header.subarray(0, 5).equals(MAGIC)) throw new Error("not a CMKB1 backup");

		const decipher = crypto.createDecipheriv("aes-256-gcm", deriveBackupKey(recoveryKeyHex, header.subarray(5, 21)), header.subarray(21, 33));
		decipher.setAuthTag(tag);
		try {
			await pipeline(
				fs.createReadStream(inFile, { start: HEADER_LEN, end: size - TAG_LEN - 1 }),
				decipher,
				fs.createWriteStream(outFile, { mode: 0o600 })
			);
		} catch {
			throw new WrongRecoveryKeyError();
		}
	};

	private mongorestore = (configFile: string, archive: string, dbName: string) =>
		new Promise<void>((resolve, reject) => {
			const restore = spawn(this.options.mongorestoreBin, buildRestoreArgs(configFile, archive, dbName), {
				stdio: ["ignore", "ignore", "pipe"],
			});
			let stderr = "";
			restore.stderr.on("data", (chunk: Buffer) => {
				stderr = (stderr + chunk.toString()).slice(-2000);
			});
			restore.on("error", (error) => reject(new Error(`mongorestore not available: ${error.message}`)));
			restore.on("close", (code) => {
				if (code !== 0) reject(new Error(`mongorestore exited ${code}: ${stderr.trim()}`));
				// Exits 0 even when no namespace in the archive matched.
				else if (RESTORED_NOTHING.test(stderr)) reject(new Error("restore wrote no data"));
				else resolve();
			});
		});
}
