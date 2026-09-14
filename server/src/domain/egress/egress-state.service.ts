import { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import type { EgressState } from "@/domain/egress/egress.type.js";

export interface IEgressStateService {
	getState(): Promise<EgressState>;
}

const SERVICE_NAME = "EgressStateService";

// Read-only view of the instance-global egress state for the API process. Transitions are
// owned by the worker (egress.service.ts); this exists so the controller never touches the repository.
export class EgressStateService implements IEgressStateService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(private egressStateRepository: IEgressStateRepository) {}

	getState = async (): Promise<EgressState> => {
		return this.egressStateRepository.findSingleton();
	};
}
