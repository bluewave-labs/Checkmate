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
import {
	fetchMonitorCertificate,
	requireString,
	optionalString,
	optionalNumber,
	optionalBoolean,
	parseMonitorTypeFilter,
	parseSortOrder,
	requireTeamId,
} from "./controllerUtils.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorService } from "@/service/index.js";

const SERVICE_NAME = "monitorController";
class MonitorController {
	static SERVICE_NAME = SERVICE_NAME;

	private monitorService: IMonitorService;

	constructor(monitorService: IMonitorService) {
		this.monitorService = monitorService;
	}

	get serviceName() {
		return MonitorController.SERVICE_NAME;
	}

	async verifyTeamAccess(teamId: string, monitorId: string) {
		const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });
		if (monitor.teamId !== teamId) {
			throw new AppError({ message: "Access denied", status: 403 });
		}
	}

	getMonitorCertificate = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getCertificateParamValidation.validateAsync(req.params);
			const teamId = requireTeamId(req?.user?.teamId);
			const monitorId = requireString(req.params?.monitorId, "Monitor ID");
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
			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const dateRange = requireString(req?.query?.dateRange, "dateRange");
			const normalize = optionalBoolean(req?.query?.normalize, "normalize");
			const teamId = requireTeamId(req?.user?.teamId);

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

			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const dateRange = requireString(req?.query?.dateRange, "dateRange");
			const teamId = requireTeamId(req?.user?.teamId);

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
	getPageSpeedDetailsById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getHardwareDetailsByIdParamValidation.validateAsync(req.params);
			await getHardwareDetailsByIdQueryValidation.validateAsync(req.query);

			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const dateRange = requireString(req?.query?.dateRange, "dateRange");
			const teamId = requireTeamId(req?.user?.teamId);

			const data = await this.monitorService.getPageSpeedDetailsById({
				teamId,
				monitorId,
				dateRange,
			});

			return res.status(200).json({
				success: true,
				msg: "Page speed details retrieved successfully",
				data,
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorByIdParamValidation.validateAsync(req.params);
			await getMonitorByIdQueryValidation.validateAsync(req.query);

			const teamId = requireTeamId(req?.user?.teamId);
			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");

			const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });

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

			const userId = requireString(req?.user?.id, "User ID");
			const teamId = requireTeamId(req?.user?.teamId);

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

			const userId = requireString(req?.user?.id, "User ID");
			const teamId = requireTeamId(req?.user?.teamId);

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
			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const teamId = requireTeamId(req?.user?.teamId);

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
			const teamId = requireTeamId(req?.user?.teamId);

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
			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const teamId = requireTeamId(req?.user?.teamId);

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

			const monitorId = requireString(req?.params?.monitorId, "Monitor ID");
			const teamId = requireTeamId(req?.user?.teamId);

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
			const id = requireString(req?.user?.id, "User ID");
			const teamId = requireTeamId(req?.user?.teamId);
			const demoMonitors = await this.monitorService.addDemoMonitors({ userId: id, teamId });

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

			const teamId = requireTeamId(req?.user?.teamId);
			const type = parseMonitorTypeFilter(req.query?.type);
			const filter = optionalString(req.query?.filter, "filter");

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

	getMonitorsWithChecksByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			await getMonitorsByTeamIdParamValidation.validateAsync(req.params);
			await getMonitorsWithChecksQueryValidation.validateAsync(req.query);

			const explain = optionalBoolean(req?.query?.explain, "explain");
			const limit = optionalNumber(req?.query?.limit, "limit");
			const page = optionalNumber(req?.query?.page, "page");
			const rowsPerPage = optionalNumber(req?.query?.rowsPerPage, "rowsPerPage");
			const filter = optionalString(req?.query?.filter, "filter");
			const field = optionalString(req?.query?.field, "field");
			const order = parseSortOrder(req?.query?.order);
			const type = parseMonitorTypeFilter(req?.query?.type);
			const teamId = requireTeamId(req?.user?.teamId);

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
