import { MonitorEvaluation } from "@/worker/worker.interface.js";

export interface IMonitorReactor {
	readonly name: string;
	readonly blocking: boolean;
	react(evaluation: MonitorEvaluation): Promise<void>;
}
