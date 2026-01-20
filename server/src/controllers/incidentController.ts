import { AppError } from "@/utils/AppError.js";
import { Request, Response, NextFunction } from "express";

const SERVICE_NAME = "incidentController";

class IncidentController {
	static SERVICE_NAME = SERVICE_NAME;

	private incidentService: any;
	constructor(incidentService: any) {
		this.incidentService = incidentService;
	}

	get serviceName() {
		return IncidentController.SERVICE_NAME;
	}

	getIncidentsByTeam = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.incidentService.getIncidentsByTeam({
				teamId: req?.user?.teamId,
				query: req?.query?.limit,
			});

			return res.status(200).json({
				success: true,
				msg: "Incidents retrieved successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};

	getIncidentSummary = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req.user?.teamId;

			if (!teamId) {
				throw new AppError({ message: "Team ID is required", service: SERVICE_NAME, status: 400 });
			}

			const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

			const summary = await this.incidentService.getIncidentSummary(req?.user?.teamId, limit);

			return res.status(200).json({
				success: true,
				msg: "Incident summary retrieved successfully",
				data: summary,
			});
		} catch (error) {
			next(error);
		}
	};

	getIncidentById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const incident = await this.incidentService.getIncidentById({
				incidentId: req?.params?.incidentId,
				teamId: req?.user?.teamId,
			});

			return res.status(200).json({
				success: true,
				msg: "Incident retrieved successfully",
				data: incident,
			});
		} catch (error) {
			next(error);
		}
	};

	resolveIncidentManually = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const resolvedIncident = await this.incidentService.resolveIncident(
				req?.params?.incidentId,
				req?.user?.id,
				req?.user?.teamId,
				req?.body?.comment
			);

			return res.status(200).json({
				success: true,
				msg: "Incident resolved successfully",
				data: resolvedIncident,
			});
		} catch (error) {
			next(error);
		}
	};
}

export default IncidentController;
