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
			message: `Reactor ${reactor.name} failed for monitor ${evaluation.monitor.id}`,
			service: SERVICE_NAME,
			method: "dispatch",
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
