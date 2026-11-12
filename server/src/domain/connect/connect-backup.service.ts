import path from "node:path";
import type { Mongoose } from "mongoose";
import type { IDb } from "@/db/db.interface.js";
import { decryptFile, encryptToFile, recoveryKeyId } from "@/domain/connect/connect.backup-format.js";
import type { IConnectBackupTools } from "@/domain/connect/connect.backup-tools.js";
import type { IConnectApiService } from "@/domain/connect/connect-api.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type {
	ConnectBackupKind,
	ConnectBackupResult,
	ConnectKeyCheck,
	ConnectOperation,
	ConnectProgress,
	ConnectProgressStage,
	ConnectSealedArchive,
} from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectBackupService";
const PROGRESS_WRITE_MS = 1_000;
const ARCHIVE_NAME = "backup.cmkb";
const WRONG_KEY_MESSAGE = "decryption failed: wrong recovery key or corrupted archive";

export interface IConnectBackupService {
	backup(input: { enrollment: ConnectEnrollment; recoveryKey: string; kind: ConnectBackupKind }): Promise<ConnectBackupResult>;
	restore(input: { enrollment: ConnectEnrollment; recoveryKey: string; backupId: string }): Promise<ConnectBackupResult>;
	verify(input: { enrollment: ConnectEnrollment; recoveryKey: string }): Promise<ConnectKeyCheck>;
}

export class ConnectBackupService implements IConnectBackupService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private lastProgressWriteAt = 0;
	private progressWrites: Promise<void> = Promise.resolve();

	constructor(
		private tools: IConnectBackupTools,
		private connectApiService: IConnectApiService,
		private connectRepository: IConnectRepository,
		private db: IDb<Mongoose>,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private reportProgress = (progress: ConnectProgress, force: boolean) => {
		const now = Date.now();
		if (!force && now - this.lastProgressWriteAt < PROGRESS_WRITE_MS) return;
		this.lastProgressWriteAt = now;
		this.progressWrites = this.progressWrites
			.then(() => this.connectRepository.setProgress(progress))
			.catch((error: unknown) => {
				this.logger.warn({ err: error }, "Could not record Connect backup progress");
			});
	};

	private progress = (
		operation: ConnectOperation,
		stage: ConnectProgressStage,
		values: { percent?: number; bytes?: number; attempt?: number; attempts?: number } = {}
	): ConnectProgress => {
		return {
			operation,
			stage,
			percent: values.percent ?? null,
			bytes: values.bytes ?? null,
			attempt: values.attempt ?? null,
			attempts: values.attempts ?? null,
		};
	};

	private failure = (kind: ConnectBackupKind | null, error: unknown, backupId: string | null = null): ConnectBackupResult => {
		return {
			ok: false,
			at: new Date(),
			kind,
			sizeBytes: null,
			sha256: null,
			backupId,
			durationMs: null,
			error: error instanceof Error ? error.message : "unknown error",
		};
	};

	private seal = async (
		configFile: string,
		dbName: string,
		kind: ConnectBackupKind,
		archive: string,
		recoveryKey: string
	): Promise<ConnectSealedArchive> => {
		const dump = this.tools.dump(configFile, dbName, kind);
		const [sealed, exited] = await Promise.allSettled([
			encryptToFile(dump.stdout, archive, recoveryKey, (bytes) => this.reportProgress(this.progress("backup", "dumping", { bytes }), false)),
			dump.exited,
		]);
		if (exited.status === "rejected") throw exited.reason;
		if (sealed.status === "rejected") throw sealed.reason;
		return sealed.value;
	};

	private store = async (
		enrollment: ConnectEnrollment,
		recoveryKey: string,
		kind: ConnectBackupKind,
		archive: string,
		sealed: ConnectSealedArchive
	): Promise<string> => {
		const ticket = await this.connectApiService.requestUpload(enrollment, {
			kind,
			...sealed,
			keyId: recoveryKeyId(recoveryKey),
		});
		try {
			this.reportProgress(this.progress("backup", "uploading"), true);
			await this.connectApiService.upload(ticket.uploadUrl, archive, sealed.sizeBytes, (percent) =>
				this.reportProgress(this.progress("backup", "uploading", { percent }), false)
			);
			this.reportProgress(this.progress("backup", "saving"), true);
			await this.connectApiService.complete(enrollment, ticket.backupId);
			this.logger.info({ backupId: ticket.backupId }, "Connect backup stored");
			return ticket.backupId;
		} catch (error: unknown) {
			await this.connectApiService.abandon(enrollment, ticket.backupId);
			throw error;
		}
	};

	backup = async ({
		enrollment,
		recoveryKey,
		kind,
	}: {
		enrollment: ConnectEnrollment;
		recoveryKey: string;
		kind: ConnectBackupKind;
	}): Promise<ConnectBackupResult> => {
		const startedAt = Date.now();
		this.reportProgress(this.progress("backup", "dumping"), true);
		try {
			const dbName = (await this.db.getConnection()).connection.name;
			return await this.tools.withWorkDir(async (dir, configFile): Promise<ConnectBackupResult> => {
				const archive = path.join(dir, ARCHIVE_NAME);
				const sealed = await this.seal(configFile, dbName, kind, archive, recoveryKey);
				this.logger.info({ kind, sizeBytes: sealed.sizeBytes }, "Connect backup archive encrypted");
				const backupId = await this.store(enrollment, recoveryKey, kind, archive, sealed);
				return {
					ok: true,
					at: new Date(),
					kind,
					sizeBytes: sealed.sizeBytes,
					sha256: sealed.sha256,
					backupId,
					durationMs: Date.now() - startedAt,
					error: null,
				};
			});
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Connect backup failed");
			return this.failure(kind, error);
		} finally {
			await this.progressWrites;
		}
	};

	restore = async ({
		enrollment,
		recoveryKey,
		backupId,
	}: {
		enrollment: ConnectEnrollment;
		recoveryKey: string;
		backupId: string;
	}): Promise<ConnectBackupResult> => {
		const startedAt = Date.now();
		this.reportProgress(this.progress("restore", "downloading"), true);
		try {
			const dbName = (await this.db.getConnection()).connection.name;
			await this.tools.withRestoreWorkDir(async (dir, configFile) => {
				const encrypted = path.join(dir, "restore.cmkb");
				const archive = path.join(dir, "restore.archive.gz");
				await this.connectApiService.download(enrollment, backupId, encrypted, (percent) =>
					this.reportProgress(this.progress("restore", "downloading", { percent }), false)
				);
				this.reportProgress(this.progress("restore", "decrypting"), true);
				const decrypted = await decryptFile(encrypted, archive, recoveryKey);
				if (!decrypted) throw new Error(WRONG_KEY_MESSAGE);
				this.reportProgress(this.progress("restore", "restoring"), true);
				await this.tools.restore(configFile, archive, dbName);
			});
			this.logger.info({ backupId }, "Connect restore completed");
			return {
				ok: true,
				at: new Date(),
				kind: null,
				sizeBytes: null,
				sha256: null,
				backupId,
				durationMs: Date.now() - startedAt,
				error: null,
			};
		} catch (error: unknown) {
			this.logger.error({ err: error, backupId }, "Connect restore failed");
			return this.failure(null, error, backupId);
		} finally {
			await this.progressWrites;
		}
	};

	verify = async ({ enrollment, recoveryKey }: { enrollment: ConnectEnrollment; recoveryKey: string }): Promise<ConnectKeyCheck> => {
		this.reportProgress(this.progress("verify", "downloading"), true);
		try {
			const backups = await this.connectApiService.list(enrollment);
			if (backups.length === 0) return "no-backups";
			const keyId = recoveryKeyId(recoveryKey);
			const candidates = backups
				.filter((backup) => !backup.keyId || backup.keyId === keyId)
				.sort((a, b) => Number(b.keyId === keyId) - Number(a.keyId === keyId) || a.sizeBytes - b.sizeBytes);
			for (const [index, candidate] of candidates.entries()) {
				const attempt = { attempt: index + 1, attempts: candidates.length };
				const opened = await this.tools.withWorkDir(async (dir) => {
					const encrypted = path.join(dir, "verify.cmkb");
					this.reportProgress(this.progress("verify", "downloading", attempt), true);
					await this.connectApiService.download(enrollment, candidate.id, encrypted, (percent) =>
						this.reportProgress(this.progress("verify", "downloading", { ...attempt, percent }), false)
					);
					this.reportProgress(this.progress("verify", "decrypting", attempt), true);
					return decryptFile(encrypted, path.join(dir, "verify.archive.gz"), recoveryKey);
				});
				if (opened) return "ok";
			}
			return "wrong-key";
		} finally {
			await this.progressWrites;
		}
	};
}
