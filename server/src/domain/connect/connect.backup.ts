import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
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

// Config backups skip high-churn operational data so frequent schedules stay
// small; monitors, users, teams, settings and status pages are kept.
const CONFIG_EXCLUDED_COLLECTIONS = ["checks", "monitorstats", "geochecks", "dockerlogs", "dlqitems", "jobs"];

export const deriveBackupKey = (recoveryKeyHex: string, salt: Buffer) =>
	Buffer.from(crypto.hkdfSync("sha256", Buffer.from(recoveryKeyHex, "hex"), salt, INFO, 32));

export const buildDumpArgs = (configFile: string, dbName: string, kind: ConnectBackupKind) => {
	const excluded = [CONNECT_STATE_COLLECTION, ...(kind === "config" ? CONFIG_EXCLUDED_COLLECTIONS : [])];
	return [`--config=${configFile}`, "--archive", "--gzip", `--db=${dbName}`, ...excluded.map((name) => `--excludeCollection=${name}`)];
};

export const buildRestoreArgs = (configFile: string, archiveFile: string) => [
	`--config=${configFile}`,
	`--archive=${archiveFile}`,
	"--gzip",
	"--drop",
];

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

export class ConnectBackup {
	private running = false;
	private restoring = false;
	private lastResult: BackupResult | null = null;
	private lastRestore: BackupResult | null = null;

	constructor(private options: BackupOptions) {}

	status = () => ({
		running: this.running,
		restoring: this.restoring,
		lastResult: this.lastResult,
		lastRestore: this.lastRestore,
	});

	private apiBase = (enrollment: ConnectEnrollment) => {
		if (this.options.apiBaseOverride) return this.options.apiBaseOverride;
		if (enrollment.apiUrl) return enrollment.apiUrl;
		return `https://${new URL(enrollment.connectUrl.replace(/^wss:/, "https:")).host}`;
	};

	// Runs in a private temp directory: the database URI goes in a config file
	// there because command-line arguments are visible to the whole system.
	private withWorkDir = async <T>(work: (dir: string, configFile: string) => Promise<T>) => {
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "checkmate-connect-"));
		try {
			const configFile = path.join(dir, "mongo.yaml");
			await fs.promises.writeFile(configFile, `uri: ${JSON.stringify(this.options.mongoUrl)}\n`, { mode: 0o600 });
			return await work(dir, configFile);
		} finally {
			await fs.promises.rm(dir, { recursive: true, force: true });
		}
	};

	start = ({ enrollment, recoveryKeyHex, kind }: BackupRun & { kind: ConnectBackupKind }) => {
		if (this.running || this.restoring) {
			return { started: false, error: "a backup or restore is already running" };
		}
		this.running = true;
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

			const upload = await fetch(ticket.uploadUrl, {
				method: "PUT",
				headers: { "content-length": String(sizeBytes), "content-type": "application/octet-stream" },
				body: Readable.toWeb(fs.createReadStream(archive)) as unknown as BodyInit,
				duplex: "half",
			} as RequestInit);
			if (!upload.ok) throw new Error(`blob upload failed (${upload.status})`);

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
		});

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
		if (this.running || this.restoring) {
			return { started: false, error: "a backup or restore is already running" };
		}
		this.restoring = true;
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
			});
		return { started: true };
	};

	private restore = (enrollment: ConnectEnrollment, recoveryKeyHex: string, backupId: string) =>
		this.withWorkDir(async (dir, configFile): Promise<BackupResult> => {
			const startedAt = Date.now();
			const encrypted = path.join(dir, "restore.cmkb");
			const archive = path.join(dir, "restore.archive.gz");

			const ticket = await postJson<{ downloadUrl: string; sha256: string; sizeBytes: number }>(
				`${this.apiBase(enrollment)}/api/agent/backups/${backupId}/download`,
				{ agentId: enrollment.agentId },
				enrollment.token
			);

			const download = await fetch(ticket.downloadUrl);
			if (!download.ok || !download.body) throw new Error(`blob download failed (${download.status})`);
			const hash = crypto.createHash("sha256");
			const body = Readable.fromWeb(download.body as WebReadableStream);
			body.on("data", (chunk: Buffer) => hash.update(chunk));
			await pipeline(body, fs.createWriteStream(encrypted, { mode: 0o600 }));

			if (hash.digest("hex") !== ticket.sha256) {
				throw new Error("downloaded archive does not match its recorded checksum");
			}
			const size = fs.statSync(encrypted).size;
			if (size !== ticket.sizeBytes) throw new Error(`downloaded size ${size} != recorded ${ticket.sizeBytes}`);

			await this.decryptFile(encrypted, archive, recoveryKeyHex);
			await this.mongorestore(configFile, archive);
			this.options.log.info({ backupId }, "Connect restore completed");
			return { ok: true, at: new Date().toISOString(), backupId, durationMs: Date.now() - startedAt };
		});

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
			throw new Error("decryption failed: wrong recovery key or corrupted archive");
		}
	};

	private mongorestore = (configFile: string, archive: string) =>
		new Promise<void>((resolve, reject) => {
			const restore = spawn(this.options.mongorestoreBin, buildRestoreArgs(configFile, archive), {
				stdio: ["ignore", "ignore", "pipe"],
			});
			let stderr = "";
			restore.stderr.on("data", (chunk: Buffer) => {
				stderr = (stderr + chunk.toString()).slice(-2000);
			});
			restore.on("error", (error) => reject(new Error(`mongorestore not available: ${error.message}`)));
			restore.on("close", (code) => {
				if (code === 0) resolve();
				else reject(new Error(`mongorestore exited ${code}: ${stderr.trim()}`));
			});
		});
}
