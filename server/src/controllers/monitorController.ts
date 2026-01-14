import { Request, Response, NextFunction } from "express";

import {
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdParamValidation,
	getMonitorsByTeamIdQueryValidation,
	getMonitorsWithChecksQueryValidation,
	createMonitorBodyValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getCertificateParamValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
} from "@/validation/joi.js";
import sslChecker from "ssl-checker";
import { fetchMonitorCertificate } from "./controllerUtils.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "monitorController";
class MonitorController {
	static SERVICE_NAME = SERVICE_NAME;

	private monitorService: any;

	constructor(monitorService: any) {
		this.monitorService = monitorService;
	}

	get serviceName() {
		return MonitorController.SERVICE_NAME;
	}

	async verifyTeamAccess(teamId: string, monitorId: string) {
		const monitor = await this.monitorService.getMonitorById(monitorId);
		if (!monitor.teamId.equals(teamId)) {
			throw new AppError({ message: "Access denied", status: 403 });
		}
	}

	getMonitorCertificate = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getCertificateParamValidation.validateAsync(req.params);
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}
			const { monitorId } = req.params;
			const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });
			const certificate = await fetchMonitorCertificate(sslChecker, monitor);

			return res.status(200).json({
				success: true,
				msg: "SSL certificate retrieved successfully",
				data: {
					certificateDate: new Date(certificate.validTo),
				},
			});
		} catch (error) {
			next(error);
		}
	};

	getUptimeDetailsById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const monitorId = req?.params?.monitorId;
			const dateRange = req?.query?.dateRange;
			const normalize = req?.query?.normalize;

			const teamId = req?.user?.teamId;

			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const data = await this.monitorService.getUptimeDetailsById({
				teamId,
				monitorId,
				dateRange,
				normalize,
			});
			return res.status(200).json({
				success: true,
				msg: "Uptime details retrieved successfully",
				data: data,
			});
		} catch (error) {
			next(error);
		}
	};

	getHardwareDetailsById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getHardwareDetailsByIdParamValidation.validateAsync(req.params);
			await getHardwareDetailsByIdQueryValidation.validateAsync(req.query);

			const monitorId = req?.params?.monitorId;
			const dateRange = req?.query?.dateRange;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const monitor = await this.monitorService.getHardwareDetailsById({
				teamId,
				monitorId,
				dateRange,
			});

			return res.status(200).json({
				success: true,
				msg: "Hardware details retrieved successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await getMonitorByIdQueryValidation.validateAsync(req.query);

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const monitor = await this.monitorService.getMonitorById({ teamId, monitorId: req?.params?.monitorId });

			return res.status(200).json({
				success: true,
				msg: "Monitor retrieved successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	createMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await createMonitorBodyValidation.validateAsync(req.body);

			const userId = req?.user?._id;
			const teamId = req?.user?.teamId;

			const monitor = await this.monitorService.createMonitor(teamId, userId, req.body);

			return res.status(200).json({
				success: true,
				msg: "Monitor created successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	createBulkMonitors = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.file) {
				throw new AppError({ message: "No file uploaded", status: 400 });
			}

			if (!req.file.mimetype.includes("csv")) {
				throw new AppError({ message: "File is not a CSV", status: 400 });
			}

			if (req.file.size === 0) {
				throw new AppError({ message: "File is empty", status: 400 });
			}

			const userId = req?.user?._id;
			const teamId = req?.user?.teamId;

			if (!userId || !teamId) {
				throw new AppError({ message: "Missing userId or teamId", status: 400 });
			}

			const fileData = req?.file?.buffer?.toString("utf-8");
			if (!fileData) {
				throw new AppError({ message: "Cannot get file from buffer", status: 400 });
			}

			const monitors = await this.monitorService.createBulkMonitors(fileData, userId, teamId);

			return res.status(200).json({
				success: true,
				msg: "Bulk monitors created successfully",
				data: monitors,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const deletedMonitor = await this.monitorService.deleteMonitor({ teamId, monitorId });

			return res.status(200).json({
				success: true,
				msg: "Monitor deleted successfully",
				data: deletedMonitor,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteAllMonitors = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const deletedCount = await this.monitorService.deleteAllMonitors({ teamId });

			return res.status(200).json({
				success: true,
				msg: `Deleted ${deletedCount} monitors`,
			});
		} catch (error) {
			next(error);
		}
	};

	editMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await editMonitorBodyValidation.validateAsync(req.body);
			const monitorId = req?.params?.monitorId;

			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const editedMonitor = await this.monitorService.editMonitor({ teamId, monitorId, body: req.body });

			return res.status(200).json({
				success: true,
				msg: "Monitor edited successfully",
				data: editedMonitor,
			});
		} catch (error) {
			next(error);
		}
	};

	pauseMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await pauseMonitorParamValidation.validateAsync(req.params);

			const monitorId = req.params.monitorId;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const monitor = await this.monitorService.pauseMonitor({ teamId, monitorId });

			return res.status(200).json({
				success: true,
				msg: monitor.isActive ? "Monitor resumed successfully" : "Monitor paused successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	addDemoMonitors = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { _id, teamId } = req.user;
			const demoMonitors = await this.monitorService.addDemoMonitors({ userId: _id, teamId });

			return res.status(200).json({
				success: true,
				msg: "Demo monitors added successfully",
				data: demoMonitors?.length ?? 0,
			});
		} catch (error) {
			next(error);
		}
	};

	sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { to } = req.body;
			if (!to || typeof to !== "string") {
				throw new AppError({ message: "Invalid 'to' email address", status: 400 });
			}

			const messageId = await this.monitorService.sendTestEmail({ to });
			return res.status(200).json({
				success: true,
				msg: "Test email sent successfully",
				data: { messageId },
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

			const { type, filter } = req.query;
			const teamId = req?.user?.teamId;

			const monitors = await this.monitorService.getMonitorsByTeamId({ teamId, type, filter });

			return res.status(200).json({
				success: true,
				msg: "Monitors retrieved successfully",
				data: monitors,
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorsAndSummaryByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsByTeamIdQueryValidation.validateAsync(req.query);

			const explain = req?.query?.explain;
			const type = req?.query?.type;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const result = await this.monitorService.getMonitorsAndSummaryByTeamId({ teamId, type, explain });

			return res.status(200).json({
				msg: "Monitors and summary retrieved successfully",
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorsWithChecksByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsWithChecksQueryValidation.validateAsync(req.query);

			const explain = req?.query?.explain;
			let { limit, type, page, rowsPerPage, filter, field, order } = req.query;
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const monitors = await this.monitorService.getMonitorsWithChecksByTeamId({
				teamId,
				limit,
				type,
				page,
				rowsPerPage,
				filter,
				field,
				order,
				explain,
			});

			return res.status(200).json({
				msg: "Monitors retrieved successfully",
				data: monitors,
			});
		} catch (error) {
			next(error);
		}
	};
	exportMonitorsToCSV = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const csv = await this.monitorService.exportMonitorsToCSV({ teamId });
			res.setHeader("Content-Type", "text/csv");
			res.setHeader("Content-Disposition", "attachment; filename=monitors.csv");
			return res.send(csv);
		} catch (error) {
			next(error);
		}
	};

	exportMonitorsToJSON = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const json = await this.monitorService.exportMonitorsToJSON({ teamId });

			return res.status(200).json({
				success: true,
				msg: "Monitors exported successfully",
				data: json,
			});
		} catch (error) {
			next(error);
		}
	};

	getAllGames = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const games = this.monitorService.getAllGames();
			return res.status(200).json({
				success: true,
				msg: "Supported games retrieved successfully",
				data: games,
			});
		} catch (error) {
			next(error);
		}
	};

	getGroupsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = req?.user?.teamId;
			if (!teamId) {
				throw new AppError({ message: "Team ID is required", status: 400 });
			}

			const groups = await this.monitorService.getGroupsByTeamId({ teamId });

			return res.status(200).json({
				msg: "Groups retrieved successfully",
				data: groups,
			});
		} catch (error) {
			next(error);
		}
	};
}

export default MonitorController;
