import path from "node:path";
import type { Mongoose } from "mongoose";
import type { IDb } from "@/db/db.interface.js";
import { encryptToFile, recoveryKeyId } from "@/domain/connect/connect.backup-format.js";
import type { IConnectBackupTools } from "@/domain/connect/connect.backup-tools.js";
import type { IConnectApiService } from "@/domain/connect/connect-api.service.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ConnectBackupKind, ConnectBackupResult, ConnectProgress, ConnectSealedArchive } from "@/domain/connect/connect-backup.type.js";
import type { ConnectEnrollment } from "@/domain/connect/connect.type.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectBackupService";
const PROGRESS_WRITE_MS = 1_000;
const ARCHIVE_NAME = "backup.cmkb";

export interface IConnectBackupService {
	backup(input: { enrollment: ConnectEnrollment; recoveryKey: string; kind: ConnectBackupKind }): Promise<ConnectBackupResult>;
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

	private failure = (kind: ConnectBackupKind, error: unknown): ConnectBackupResult => {
		return {
			ok: false,
			at: new Date(),
			kind,
			sizeBytes: null,
			sha256: null,
			backupId: null,
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
		const [sealed] = await Promise.all([
			encryptToFile(dump.stdout, archive, recoveryKey, (bytes) =>
				this.reportProgress({ operation: "backup", stage: "dumping", percent: null, bytes }, false)
			),
			dump.exited,
		]);
		return sealed;
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
			this.reportProgress({ operation: "backup", stage: "uploading", percent: null, bytes: null }, true);
			await this.connectApiService.upload(ticket.uploadUrl, archive, sealed.sizeBytes, (percent) =>
				this.reportProgress({ operation: "backup", stage: "uploading", percent, bytes: null }, false)
			);
			this.reportProgress({ operation: "backup", stage: "saving", percent: null, bytes: null }, true);
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
		this.reportProgress({ operation: "backup", stage: "dumping", percent: null, bytes: null }, true);
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
}
