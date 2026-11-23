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

	private rotateConnectSecret = async (label: string, value: string, save: (encrypted: string) => Promise<void>) => {
		try {
			if (!this.encryptionService.needsReencryption(value)) return "current";
			const plainText = this.encryptionService.decrypt(value);
			await save(this.encryptionService.encrypt(plainText));
			this.logger.info(`Checkmate Connect ${label} re-encrypted`);
			return "reencrypted";
		} catch (error: unknown) {
			this.logger.warn({ err: error }, `Could not re-encrypt the Checkmate Connect ${label}`);
			return "skipped";
		}
	};

	private rotateConnectSecrets = async () => {
		const { enrollment, recoveryKey } = await this.connectRepository.get();
		const secrets = [
			...(enrollment ? [{ label: "token", value: enrollment.token, save: (token: string) => this.connectRepository.setSecrets({ token }) }] : []),
			...(recoveryKey
				? [{ label: "recovery key", value: recoveryKey, save: (key: string) => this.connectRepository.setSecrets({ recoveryKey: key }) }]
				: []),
		];
		const result = { scanned: secrets.length, reencrypted: 0, skipped: 0 };
		if (secrets.length === 0) return result;

		if (!this.encryptionService.isConfigured()) {
			this.logger.warn("Checkmate Connect has stored secrets but ENCRYPTION_KEY is not set; Connect can't use them until it is");
			result.skipped = secrets.length;
			return result;
		}

		for (const secret of secrets) {
			const outcome = await this.rotateConnectSecret(secret.label, secret.value, secret.save);
			if (outcome === "reencrypted") result.reencrypted += 1;
			if (outcome === "skipped") result.skipped += 1;
		}
		return result;
	};

	run = async () => {
		const dockerRotationResult = await this.rotateDockerTlsKeys();
		const connectRotationResult = await this.rotateConnectSecrets();
		return {
			scanned: dockerRotationResult.scanned + connectRotationResult.scanned,
			reencrypted: dockerRotationResult.reencrypted + connectRotationResult.reencrypted,
			skipped: dockerRotationResult.skipped + connectRotationResult.skipped,
		};
	};
}
