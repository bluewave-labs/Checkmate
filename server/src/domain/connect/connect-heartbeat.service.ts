import type { Got } from "got";
import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { APP_VERSION } from "@/utils/appVersion.js";

const SERVICE_NAME = "ConnectHeartbeatService";
const TIMEOUT_MS = 10_000;

type HeartbeatOutcome = "reporting" | "rejected" | "unreachable" | "unreadable";

export interface IConnectHeartbeatService {
	handleJob(): Promise<void>;
}

export class ConnectHeartbeatService implements IConnectHeartbeatService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private lastOutcome: HeartbeatOutcome | null = null;

	constructor(
		private got: Got,
		private connectRepository: IConnectRepository,
		private encryptionService: IEncryptionService,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private heartbeatUrl = (connectUrl: string): string => {
		const url = new URL(connectUrl.replace(/^wss:/, "https:"));
		url.pathname = "/api/heartbeat";
		url.search = "";
		return url.toString();
	};

	private report = (outcome: HeartbeatOutcome, log: () => void) => {
		if (outcome !== this.lastOutcome) log();
		this.lastOutcome = outcome;
	};

	handleJob = async () => {
		try {
			const { enrollment } = await this.connectRepository.get();
			if (!enrollment) {
				this.lastOutcome = null;
				return;
			}

			let token: string;
			try {
				token = this.encryptionService.decrypt(enrollment.token);
			} catch (error: unknown) {
				this.report("unreadable", () => this.logger.warn({ err: error }, "Connect heartbeat paused: the stored credential can't be decrypted"));
				return;
			}

			let response;
			try {
				response = await this.got.post(this.heartbeatUrl(enrollment.connectUrl), {
					json: { agentId: enrollment.agentId, agentVersion: APP_VERSION },
					headers: { authorization: `Bearer ${token}`, "user-agent": `Checkmate/${APP_VERSION}` },
					timeout: { request: TIMEOUT_MS },
					retry: { limit: 0 },
					followRedirect: false,
					throwHttpErrors: false,
				});
			} catch (error: unknown) {
				this.report("unreachable", () => this.logger.warn({ err: error }, "Connect heartbeat unreachable"));
				return;
			}

			if (response.statusCode >= 200 && response.statusCode < 300) {
				this.report("reporting", () => this.logger.info("Connect heartbeat reporting"));
				return;
			}
			this.report("rejected", () => this.logger.warn({ statusCode: response.statusCode }, `Connect heartbeat rejected (${response.statusCode})`));
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Connect heartbeat failed");
		}
	};
}
