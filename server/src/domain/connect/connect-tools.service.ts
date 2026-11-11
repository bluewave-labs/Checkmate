import type { IConnectBackupTools } from "@/domain/connect/connect.backup-tools.js";
import type { ConnectBackupToolName } from "@/domain/connect/connect-backup.type.js";
import type { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import { WORKER_STALE_MS } from "@/domain/queue-workers/queue-worker.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

const SERVICE_NAME = "ConnectToolsService";

export interface IConnectToolsService {
	report(): Promise<void>;
	hasTool(tool: ConnectBackupToolName): boolean;
	isAvailableOnAnotherWorker(tool: ConnectBackupToolName): Promise<boolean>;
}

export class ConnectToolsService implements IConnectToolsService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private missing: ConnectBackupToolName[] | null = null;
	private checkedAt = 0;

	constructor(
		private tools: IConnectBackupTools,
		private queueWorkersRepository: IQueueWorkersRepository,
		private workerId: string,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private check = async (): Promise<ConnectBackupToolName[]> => {
		if (this.missing !== null && this.missing.length === 0) return this.missing;
		this.missing = await this.tools.checkTools();
		this.checkedAt = Date.now();
		return this.missing;
	};

	report = async (): Promise<void> => {
		try {
			const missing = await this.check();
			await this.queueWorkersRepository.setConnectTools(this.workerId, {
				missing,
				checkedAt: this.checkedAt,
			});
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Could not publish the Connect backup tools check");
		}
	};

	hasTool = (tool: ConnectBackupToolName): boolean => {
		return this.missing === null || !this.missing.includes(tool);
	};

	isAvailableOnAnotherWorker = async (tool: ConnectBackupToolName): Promise<boolean> => {
		const workers = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		return workers.some(
			(worker) =>
				worker.workerId !== this.workerId && worker.processesJobs && worker.connectTools !== undefined && !worker.connectTools.missing.includes(tool)
		);
	};
}
