import { Request, Response, NextFunction } from "express";

import {
	getChecksParamValidation,
	getChecksQueryValidation,
	getTeamChecksQueryValidation,
	deleteChecksParamValidation,
	deleteChecksByTeamIdParamValidation,
	updateChecksTTLBodyValidation,
	ackCheckBodyValidation,
	ackAllChecksParamValidation,
	ackAllChecksBodyValidation,
} from "@/validation/joi.js";

const SERVICE_NAME = "checkController";

class CheckController {
	static SERVICE_NAME = SERVICE_NAME;

	private checkService: any;
	constructor(checkService: any) {
		this.checkService = checkService;
	}

	get serviceName() {
		return CheckController.SERVICE_NAME;
	}

	getChecksByMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getChecksParamValidation.validateAsync(req.params);
			await getChecksQueryValidation.validateAsync(req.query);

			const result = await this.checkService.getChecksByMonitor({
				monitorId: req?.params?.monitorId,
				query: req?.query,
				teamId: req?.user?.teamId,
			});

			return res.status(200).json({
				success: true,
				msg: "Checks retrieved successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};

	getChecksByTeam = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getTeamChecksQueryValidation.validateAsync(req.query);
			const checkData = await this.checkService.getChecksByTeam({
				teamId: req?.user?.teamId,
				query: req?.query,
			});
			return res.status(200).json({
				success: true,
				msg: "Team checks retrieved successfully",
				data: checkData,
			});
		} catch (error) {
			next(error);
		}
	};

	getChecksSummaryByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const summary = await this.checkService.getChecksSummaryByTeamId({ teamId: req?.user?.teamId });
			return res.status(200).json({
				success: true,
				msg: "Checks summary retrieved successfully",
				data: summary,
			});
		} catch (error) {
			next(error);
		}
	};

	ackCheck = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await ackCheckBodyValidation.validateAsync(req.body);

			const updatedCheck = await this.checkService.ackCheck({
				checkId: req?.params?.checkId,
				teamId: req?.user?.teamId,
				ack: req?.body?.ack,
			});

			return res.status(200).json({
				success: true,
				msg: "Check acknowledged successfully",
				data: updatedCheck,
			});
		} catch (error) {
			next(error);
		}
	};

	ackAllChecks = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await ackAllChecksParamValidation.validateAsync(req.params);
			await ackAllChecksBodyValidation.validateAsync(req.body);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new Error("No team ID in request");
			}

			const updatedChecks = await this.checkService.ackAllChecks({
				monitorId: req?.params?.monitorId,
				path: req?.params?.path,
				teamId: req?.user?.teamId,
				ack: req?.body?.ack,
			});

			return res.status(200).json({
				success: true,
				msg: "All checks acknowledged successfully",
				data: updatedChecks,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteChecks = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await deleteChecksParamValidation.validateAsync(req.params);

			const deletedCount = await this.checkService.deleteChecks({
				monitorId: req.params.monitorId,
				teamId: req?.user?.teamId,
			});

			return res.status(200).json({
				success: true,
				msg: "Checks deleted successfully",
				data: { deletedCount },
			});
		} catch (error) {
			next(error);
		}
	};

	deleteChecksByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await deleteChecksByTeamIdParamValidation.validateAsync(req.params);

			const deletedCount = await this.checkService.deleteChecksByTeamId({ teamId: req?.user?.teamId });

			return res.status(200).json({
				success: true,
				msg: "Checks deleted successfully",
				data: { deletedCount },
			});
		} catch (error) {
			next(error);
		}
	};

	updateChecksTTL = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await updateChecksTTLBodyValidation.validateAsync(req.body);

			await this.checkService.updateChecksTTL({
				teamId: req?.user?.teamId,
				ttl: req?.body?.ttl,
			});

			return res.status(200).json({
				success: true,
				msg: "Checks TTL updated successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default CheckController;
