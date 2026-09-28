import { RequestHandler } from "express";
import { Handler, requireTeamId, requireUserId, requireUserEmail } from "./controllerUtils.js";
import { IIncidentService } from "@/domain/incidents/incident.service.js";
import {
	getIncidentsByTeamQueryValidation,
	getIncidentSummaryQueryValidation,
	incidentIdParamValidation,
	resolveIncidentBodyValidation,
} from "@/api/validation/incidentValidation.js";

export interface IIncidentController {
	getIncidentsByTeam: RequestHandler;
	getIncidentSummary: RequestHandler;
	getIncidentById: RequestHandler;
	resolveIncidentManually: RequestHandler;
}
class IncidentController implements IIncidentController {
	private incidentService: IIncidentService;
	constructor(incidentService: IIncidentService) {
		this.incidentService = incidentService;
	}

	getIncidentsByTeam: Handler = async (req, res) => {
		const validatedQuery = getIncidentsByTeamQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.incidentService.getIncidentsByTeam(
			teamId,
			validatedQuery.sortOrder,
			validatedQuery.dateRange,
			validatedQuery.page,
			validatedQuery.rowsPerPage,
			validatedQuery.status,
			validatedQuery.monitorId,
			validatedQuery.resolutionType
		);

		res.json({ success: true, msg: "Incidents retrieved successfully", data });
	};

	getIncidentSummary: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const validatedQuery = getIncidentSummaryQueryValidation.parse(req.query);

		const data = await this.incidentService.getIncidentSummary(teamId, validatedQuery.limit);
		res.json({ success: true, msg: "Incident summary retrieved successfully", data });
	};

	getIncidentById: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { incidentId } = incidentIdParamValidation.parse(req.params);
		const data = await this.incidentService.getIncidentById(incidentId, teamId);
		res.json({ success: true, msg: "Incident retrieved successfully", data });
	};

	resolveIncidentManually: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);
		const userEmail = requireUserEmail(req.user?.email);
		const { incidentId } = incidentIdParamValidation.parse(req.params);
		const { comment } = resolveIncidentBodyValidation.parse(req.body);
		const data = await this.incidentService.resolveIncident(incidentId, userId, teamId, comment, userEmail);
		res.json({ success: true, msg: "Incident resolved successfully", data });
	};
}

export default IncidentController;
