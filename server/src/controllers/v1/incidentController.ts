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
				query: req?.query,
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
			const summary = await this.incidentService.getIncidentSummary({
				teamId: req?.user?.teamId,
				query: req?.query,
			});

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
			const resolvedIncident = await this.incidentService.resolveIncidentManually({
				incidentId: req?.params?.incidentId,
				userId: req?.user?._id,
				teamId: req?.user?.teamId,
				comment: req?.body?.comment,
			});

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
