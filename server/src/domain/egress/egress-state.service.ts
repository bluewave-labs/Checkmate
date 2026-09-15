import { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import type { EgressState } from "@/domain/egress/egress.type.js";

export interface IEgressStateService {
	getState(): Promise<EgressState>;
	reset(): Promise<EgressState>;
}

const SERVICE_NAME = "EgressStateService";

// API-process view of the instance-global egress state. Probe-driven transitions are owned by the
// worker (egress.service.ts); this exists so the controller never touches the repositories.
export class EgressStateService implements IEgressStateService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private egressStateRepository: IEgressStateRepository,
		private jobsRepository: IJobsRepository
	) {}

	getState = async (): Promise<EgressState> => {
		return this.egressStateRepository.findSingleton();
	};

	// Called when the feature is switched on or off: drop any pending recovery job and start from "ok".
	reset = async (): Promise<EgressState> => {
		await this.jobsRepository.deleteByIdAndType(null, "egress");
		return this.egressStateRepository.reset();
	};
}
