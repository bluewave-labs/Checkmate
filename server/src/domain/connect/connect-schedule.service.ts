import type { IConnectRepository } from "@/domain/connect/connect.repository.interface.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { IJobScheduler } from "@/worker/worker.interface.js";

const SERVICE_NAME = "ConnectScheduleService";

export interface IConnectScheduleService {
	handleJob(): Promise<void>;
}

export class ConnectScheduleService implements IConnectScheduleService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(
		private connectRepository: IConnectRepository,
		private scheduler: IJobScheduler,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	handleJob = async (): Promise<void> => {
		const { schedule, enrollment, recoveryKey } = await this.connectRepository.get();
		if (!schedule?.enabled || !enrollment || !recoveryKey) return;
		const queued = await this.connectRepository.requestOperation({
			type: "backup",
			kind: schedule.kind,
			requestedAt: new Date(),
			startedAt: null,
		});
		if (!queued) {
			this.logger.info("Scheduled Connect backup skipped: another backup, restore or key check is in progress");
			return;
		}
		await this.scheduler.addGlobalJob("connect-operation");
		this.logger.info({ kind: schedule.kind }, "Scheduled Connect backup queued");
	};
}
