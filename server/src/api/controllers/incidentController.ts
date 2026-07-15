import { AppError } from "@/utils/AppError.js";
import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { requireTeamId, requireUserId, requireUserEmail, extractString } from "./controllerUtils.js";
import { IIncidentService } from "@/domain/incidents/incident.service.js";
import { getIncidentsByTeamQueryValidation, getIncidentSummaryQueryValidation } from "@/api/validation/incidentValidation.js";

const SERVICE_NAME = "IncidentController";

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

	getIncidentsByTeam = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getIncidentsByTeamQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);
		const result = await this.incidentService.getIncidentsByTeam(
			teamId,
			validatedQuery.sortOrder,
			validatedQuery.dateRange,
			validatedQuery.page,
			validatedQuery.rowsPerPage,
			validatedQuery.status,
			validatedQuery.monitorId,
			validatedQuery.resolutionType
		);

		return res.status(200).json({
			success: true,
			msg: "Incidents retrieved successfully",
			data: result,
		});
	});

	getIncidentSummary = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const validatedQuery = getIncidentSummaryQueryValidation.parse(req.query);

		const summary = await this.incidentService.getIncidentSummary(teamId, validatedQuery.limit);
		return res.status(200).json({
			success: true,
			msg: "Incident summary retrieved successfully",
			data: summary,
		});
	});

	getIncidentById = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const incidentId = req.params.incidentId as string;
		if (!incidentId) {
			throw new AppError({ message: "Incident ID is required", service: SERVICE_NAME, status: 400 });
		}

		const incident = await this.incidentService.getIncidentById(incidentId, teamId);

		return res.status(200).json({
			success: true,
			msg: "Incident retrieved successfully",
			data: incident,
		});
	});

	resolveIncidentManually = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);
		const userEmail = requireUserEmail(req.user?.email);
		const incidentId = extractString(req.params?.incidentId);
		if (!incidentId) {
			throw new AppError({ message: "Incident ID is required", service: SERVICE_NAME, status: 400 });
		}

		const comment = extractString(req.body?.comment);
		const resolvedIncident = await this.incidentService.resolveIncident(incidentId, userId, teamId, comment, userEmail);

		return res.status(200).json({
			success: true,
			msg: "Incident resolved successfully",
			data: resolvedIncident,
		});
	});
}

export default IncidentController;
