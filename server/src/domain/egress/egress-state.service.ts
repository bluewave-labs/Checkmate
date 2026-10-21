import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { BANNER_FRESHNESS_MS, type EgressSummary } from "@/domain/egress/egress.type.js";
import type { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import { WORKER_STALE_MS } from "@/domain/queue-workers/queue-worker.model.js";

export interface IEgressStateService {
	getSummary(): Promise<EgressSummary>;
}

const SERVICE_NAME = "EgressStateService";

// API-process view of the live workers' egress verdicts. Each worker probes and publishes its own verdict
// (egress.service.ts); this reads them so the controller never touches the repositories.
export class EgressStateService implements IEgressStateService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private queueWorkersRepository: IQueueWorkersRepository,
		private settingsService: ISettingsService
	) {}

	getSummary = async (): Promise<EgressSummary> => {
		const settings = await this.settingsService.getCachedDBSettings();
		const allWorkers = await this.queueWorkersRepository.findRecent(WORKER_STALE_MS);
		const processingWorkers = allWorkers.filter((worker) => worker.processesJobs);
		const now = Date.now();
		const degraded = processingWorkers.filter((worker) => {
			return worker.egress?.status === "degraded" && now - worker.egress.checkedAt < BANNER_FRESHNESS_MS;
		});
		const since = degraded
			.map((degradedWorker) => degradedWorker.egress?.degradedSince)
			.filter((value): value is number => typeof value === "number")
			.sort((a, b) => a - b)[0];
		return {
			enabled: settings.egressCheckEnabled,
			status: degraded.length > 0 ? "degraded" : "ok",
			degradedSince: since !== undefined ? new Date(since).toISOString() : null,
			degradedWorkers: degraded.length,
			totalWorkers: processingWorkers.length,
		};
	};
}
