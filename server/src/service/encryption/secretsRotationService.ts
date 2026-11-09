import { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "SecretsRotationService";

export interface ISecretsRotationService {
	run(): Promise<{ scanned: number; reencrypted: number; skipped: number }>;
}

export class SecretsRotationService implements ISecretsRotationService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;

	constructor(
		private monitorsRepository: IMonitorsRepository,
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private rotateDockerTlsKeys = async () => {
		const rows = await this.monitorsRepository.findAllDockerTlsKeys();
		const result = { scanned: rows.length, reencrypted: 0, skipped: 0 };
		if (rows.length === 0) return result;

		if (!this.encryptionService.isConfigured()) {
			this.logger.warn(
				{ count: rows.length },
				"Monitors have a stored Docker TLS key but ENCRYPTION_KEY is not set; their checks will fail until it is"
			);
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
				this.logger.warn({ err: error, monitorId: id }, "Could not re-encrypt Docker TLS key for monitor");
			}
		}
		this.logger.info({ reencrypted: result.reencrypted, skipped: result.skipped, scanned: result.scanned }, "Docker TLS key rotation complete");
		return result;
	};

	private rotateConnectToken = async () => {
		const { enrollment } = await this.connectRepository.get();
		const result = { scanned: enrollment ? 1 : 0, reencrypted: 0, skipped: 0 };
		if (!enrollment) return result;

		if (!this.encryptionService.isConfigured()) {
			this.logger.warn("Checkmate Connect is enrolled but ENCRYPTION_KEY is not set; Connect can't use its credential until it is");
			result.skipped = 1;
			return result;
		}

		try {
			if (!this.encryptionService.needsReencryption(enrollment.token)) return result;
			const plainText = this.encryptionService.decrypt(enrollment.token);
			await this.connectRepository.setSecrets({ token: this.encryptionService.encrypt(plainText) });
			result.reencrypted = 1;
			this.logger.info("Checkmate Connect token re-encrypted");
		} catch (error: unknown) {
			result.skipped = 1;
			this.logger.warn({ err: error }, "Could not re-encrypt the Checkmate Connect token");
		}
		return result;
	};

	run = async () => {
		const dockerRotationResult = await this.rotateDockerTlsKeys();
		const connectRotationResult = await this.rotateConnectToken();
		return {
			scanned: dockerRotationResult.scanned + connectRotationResult.scanned,
			reencrypted: dockerRotationResult.reencrypted + connectRotationResult.reencrypted,
			skipped: dockerRotationResult.skipped + connectRotationResult.skipped,
		};
	};
}
