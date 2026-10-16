import { ILogger } from "@/utils/logger/logger.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { IMonitorReactor } from "@/worker/reactors/reactor.interface.js";

const SERVICE_NAME = "ReactorDispatcher";

export interface IReactorDispatcher {
	dispatch(evaluation: MonitorEvaluation): Promise<void>;
}

export class ReactorDispatcher implements IReactorDispatcher {
	private logger: ILogger;

	constructor(
		logger: ILogger,
		private reactors: IMonitorReactor[]
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	private logFailure(reactor: IMonitorReactor, evaluation: MonitorEvaluation, error: unknown) {
		this.logger.error({ err: error, reactor: reactor.name, monitorId: evaluation.monitor.id }, "Reactor failed");
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
