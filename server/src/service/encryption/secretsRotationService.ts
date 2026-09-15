import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "SecretsRotationService";

export interface ISecretsRotationService {
	run(): Promise<{ scanned: number; reencrypted: number; skipped: number }>;
}

export class SecretsRotationService implements ISecretsRotationService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private monitorsRepository: IMonitorsRepository,
		private encryptionService: IEncryptionService,
		private logger: ILogger
	) {}

	run = async () => {
		const rows = await this.monitorsRepository.findAllDockerTlsKeys();
		const result = { scanned: rows.length, reencrypted: 0, skipped: 0 };
		if (rows.length === 0) return result;

		if (!this.encryptionService.isConfigured()) {
			this.logger.warn({
				message: `${rows.length} monitor(s) have a stored Docker TLS key but ENCRYPTION_KEY is not set; their checks will fail until it is`,
				service: SERVICE_NAME,
				method: "run",
			});
			result.skipped = rows.length;
			return result;
		}

		for (const monitor of rows) {
			const { id, dockerTlsKey } = monitor;
			try {
				if (!this.encryptionService.needsReencryption(dockerTlsKey)) continue;
				const plainText = this.encryptionService.decrypt(dockerTlsKey);
				await this.monitorsRepository.updateDockerTlsKey(id, this.encryptionService.encrypt(plainText));
				result.reencrypted += 1;
			} catch (error: unknown) {
				result.skipped += 1;
				this.logger.warn({
					message: `Could not reencrypt Docker TLS key for monitor ${id}: ${error instanceof Error ? error.message : String(error)}`,
					service: SERVICE_NAME,
					method: "run",
					details: { monitorId: id, ...(error instanceof AppError ? error.details : {}) },
				});
			}
		}
		this.logger.info({
			message: `Docker TLS key rotation: ${result.reencrypted} re-encrypted, ${result.skipped} skipped, ${result.scanned} scanned`,
			service: SERVICE_NAME,
			method: "run",
		});
		return result;
	};
}
