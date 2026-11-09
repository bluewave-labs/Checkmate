import type { ILogger } from "@/utils/logger/logger.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ConnectBackup } from "@/domain/connect/connect.backup.js";
import type { IConnectRepository } from "@/domain/connect/connect.repository.js";
import { revealConnectState } from "@/domain/connect/connect.secrets.js";
import type { ConnectBackupResult } from "@/domain/connect/connect.type.js";

type ConnectBackupJobDeps = {
	repository: IConnectRepository;
	encryptionService: IEncryptionService;
	backups: Pick<ConnectBackup, "runAndWait">;
	log: ILogger;
};

// Runs on whichever node claims the connect-backup row, so it reads state from
// the database on every run instead of relying on the primary's copy.
export class ConnectBackupJob {
	constructor(private deps: ConnectBackupJobDeps) {}

	// Failures are recorded rather than thrown: the queue retries a thrown job
	// after 5 seconds, and a failing backup should wait for its next interval.
	handle = async () => {
		const { repository, encryptionService, backups, log } = this.deps;
		let result: ConnectBackupResult | null;
		try {
			const stored = await repository.load();
			if (!stored) return;
			const { schedule, enrollment, recoveryKey } = revealConnectState(stored, encryptionService);
			if (!schedule?.enabled || !enrollment || !recoveryKey) return;
			log.info({ kind: schedule.kind }, "Scheduled Connect backup starting");
			result = await backups.runAndWait({ enrollment, recoveryKeyHex: recoveryKey, kind: schedule.kind });
		} catch (error: unknown) {
			log.error({ err: error }, "Scheduled Connect backup could not start");
			result = { ok: false, at: new Date().toISOString(), error: error instanceof Error ? error.message : "unknown error" };
		}
		if (!result) return;
		await repository.saveLastScheduledBackup(result).catch((error: unknown) => {
			log.error({ err: error }, "Could not record the scheduled Connect backup result");
		});
	};
}
