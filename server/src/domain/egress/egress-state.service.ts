import { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { EgressState, EgressSummary } from "@/domain/egress/egress.type.js";

export interface IEgressStateService {
	getSummary(): Promise<EgressSummary>;
	reset(): Promise<EgressState>;
}

const SERVICE_NAME = "EgressStateService";

// API-process view of the instance-global egress state. Probe-driven transitions are owned by the
// worker (egress.service.ts); this exists so the controller never touches the repositories.
export class EgressStateService implements IEgressStateService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private egressStateRepository: IEgressStateRepository,
		private jobsRepository: IJobsRepository,
		private settingsService: ISettingsService
	) {}

	getSummary = async (): Promise<EgressSummary> => {
		const [settings, { status, degradedSince }] = await Promise.all([
			this.settingsService.getCachedDBSettings(),
			this.egressStateRepository.findSingleton(),
		]);
		return { enabled: settings.egressCheckEnabled, status, degradedSince };
	};

	// Called when the feature is switched on or off: drop any pending recovery job and start from "ok".
	reset = async (): Promise<EgressState> => {
		await this.jobsRepository.deleteGlobalJob("egress");
		return this.egressStateRepository.reset();
	};
}
