import { ILogger } from "@/utils/logger.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { IMonitorReactor } from "@/worker/reactors/reactor.interface.js";

const SERVICE_NAME = "ReactorDispatcher";

export interface IReactorDispatcher {
	dispatch(evaluation: MonitorEvaluation): Promise<void>;
}

export class ReactorDispatcher implements IReactorDispatcher {
	constructor(
		private logger: ILogger,
		private reactors: IMonitorReactor[]
	) {}

	private logFailure(reactor: IMonitorReactor, evaluation: MonitorEvaluation, error: unknown) {
		this.logger.error({
			message: "Reactor failed",
			service: SERVICE_NAME,
			method: "dispatch",
			details: { reactor: reactor.name, monitorId: evaluation.monitor.id },
			error,
		});
	}

	dispatch = async (evaluation: MonitorEvaluation) => {
		for (const reactor of this.reactors) {
			if (reactor.blocking) {
				try {
					await reactor.react(evaluation);
				} catch (error: unknown) {
					this.logFailure(reactor, evaluation, error);
				}
			} else {
				reactor.react(evaluation).catch((error: unknown) => this.logFailure(reactor, evaluation, error));
			}
		}
	};
}
