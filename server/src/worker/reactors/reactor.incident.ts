import { IMonitorReactor } from "@/worker/reactors/reactor.interface.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { IIncidentService } from "@/domain/incidents/incident.service.js";

export class IncidentReactor implements IMonitorReactor {
	readonly name = "incident";
	readonly blocking = true;
	constructor(private incidentService: IIncidentService) {}

	react = async (evaluation: MonitorEvaluation) => {
		await this.incidentService.handleIncident(evaluation.monitor, evaluation.statusChange.code, evaluation.decision, evaluation.status);
	};
}
