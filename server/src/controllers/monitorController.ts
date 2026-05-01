import { Request, Response, NextFunction } from "express";
import { updateNotificationsValidation } from "@/validation/notificationValidation.js";
import {
	getMonitorByIdParamValidation,
	getMonitorByIdQueryValidation,
	getMonitorsByTeamIdQueryValidation,
	getMonitorsWithChecksQueryValidation,
	createMonitorBodyValidation,
	editMonitorBodyValidation,
	pauseMonitorParamValidation,
	getCertificateParamValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
	getUptimeDetailsByIdParamValidation,
	getUptimeDetailsByIdQueryValidation,
	importMonitorsBodyValidation,
	bulkPauseMonitorBodyValidation,
} from "@/validation/monitorValidation.js";
import sslChecker from "ssl-checker";
import { fetchMonitorCertificate, requireTeamId, requireUserId } from "@/controllers/controllerUtils.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorService, INotificationsService } from "@/service/index.js";

const SERVICE_NAME = "monitorController";

export interface IMonitorController {
	getMonitorCertificate: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getUptimeDetailsById: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getHardwareDetailsById: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getPageSpeedDetailsById: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getGeoChecksByMonitorId: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getMonitorById: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	createMonitor: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	importMonitorsFromJSON: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteMonitor: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteAllMonitors: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	editMonitor: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	pauseMonitor: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	bulkPauseMonitors: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	addDemoMonitors: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getMonitorsByTeamId: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getMonitorsWithChecksByTeamId: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	exportMonitorsToJSON: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getAllGames: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getGroupsByTeamId: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	updateNotifications: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}
class MonitorController implements IMonitorController {
	static SERVICE_NAME = SERVICE_NAME;

	private monitorService: IMonitorService;
	private notificationsService: INotificationsService;

	constructor(monitorService: IMonitorService, notificationsService: INotificationsService) {
		this.monitorService = monitorService;
		this.notificationsService = notificationsService;
	}

	get serviceName() {
		return MonitorController.SERVICE_NAME;
	}

	getMonitorCertificate = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getCertificateParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const monitor = await this.monitorService.getMonitorById({ teamId, monitorId: validatedParams.monitorId });
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
			const validatedParams = getUptimeDetailsByIdParamValidation.parse(req.params);
			const validatedQuery = getUptimeDetailsByIdQueryValidation.parse(req.query);

			const monitorId = validatedParams.monitorId;
			const dateRange = validatedQuery.dateRange;

			const teamId = requireTeamId(req.user?.teamId);

			const data = await this.monitorService.getUptimeDetailsById({
				teamId,
				monitorId,
				dateRange,
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
			const validatedParams = getHardwareDetailsByIdParamValidation.parse(req.params);
			const validatedQuery = getHardwareDetailsByIdQueryValidation.parse(req.query);

			const monitorId = validatedParams.monitorId;
			const dateRange = validatedQuery.dateRange || "recent";
			const teamId = requireTeamId(req.user?.teamId);

			const data = await this.monitorService.getHardwareDetailsById({
				teamId,
				monitorId,
				dateRange,
			});

			return res.status(200).json({
				success: true,
				msg: "Hardware details retrieved successfully",
				data: data,
			});
		} catch (error) {
			next(error);
		}
	};
	getPageSpeedDetailsById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getHardwareDetailsByIdParamValidation.parse(req.params);
			const validatedQuery = getHardwareDetailsByIdQueryValidation.parse(req.query);

			const monitorId = validatedParams.monitorId;
			const dateRange = validatedQuery.dateRange || "recent";
			const teamId = requireTeamId(req.user?.teamId);

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

	getGeoChecksByMonitorId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getMonitorByIdParamValidation.parse(req.params);
			const validatedQuery = getMonitorByIdQueryValidation.parse(req.query);

			const monitorId = validatedParams.monitorId;
			const dateRange = validatedQuery.dateRange || "recent";
			const continentParam = validatedQuery.continent;
			const continents = continentParam ? (Array.isArray(continentParam) ? continentParam : [continentParam]) : undefined;
			const teamId = requireTeamId(req.user?.teamId);

			const data = await this.monitorService.getGeoChecksByMonitorId({
				teamId,
				monitorId,
				dateRange,
				continents,
			});

			return res.status(200).json({
				success: true,
				msg: "Geo checks retrieved successfully",
				data,
			});
		} catch (error) {
			next(error);
		}
	};

	getMonitorById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getMonitorByIdParamValidation.parse(req.params);

			const teamId = requireTeamId(req.user?.teamId);
			const monitorId = validatedParams.monitorId;

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
			const validatedBody = createMonitorBodyValidation.parse(req.body);

			const userId = requireUserId(req.user?.id);
			const teamId = requireTeamId(req.user?.teamId);

			const monitor = await this.monitorService.createMonitor(teamId, userId, validatedBody);

			return res.status(200).json({
				success: true,
				msg: "Monitor created successfully",
				data: monitor,
			});
		} catch (error) {
			next(error);
		}
	};

	importMonitorsFromJSON = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const validatedBody = importMonitorsBodyValidation.parse(req.body);
			const monitors = validatedBody.monitors;

			const result = await this.monitorService.importMonitorsFromJSON({ teamId, userId, monitors });

			return res.status(200).json({
				success: true,
				msg: `Successfully imported ${result.imported} monitor(s)`,
				data: result,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteMonitor = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedParams = getMonitorByIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const monitorId = validatedParams.monitorId;

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
			const teamId = requireTeamId(req.user?.teamId);
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
			const validatedParams = getMonitorByIdParamValidation.parse(req.params);
			const validatedBody = editMonitorBodyValidation.parse(req.body);
			const monitorId = validatedParams.monitorId;
			const teamId = requireTeamId(req.user?.teamId);

			const editedMonitor = await this.monitorService.editMonitor({ teamId, monitorId, body: validatedBody });

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
			const validatedParams = pauseMonitorParamValidation.parse(req.params);

			const monitorId = validatedParams.monitorId;
			const teamId = requireTeamId(req.user?.teamId);

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

	bulkPauseMonitors = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedBody = bulkPauseMonitorBodyValidation.parse(req.body);

			const { monitorIds, pause } = validatedBody;
			const teamId = requireTeamId(req.user?.teamId);

			const monitors = await this.monitorService.bulkPauseMonitors({ teamId, monitorIds, pause });

			const action = pause ? "paused" : "resumed";

			return res.status(200).json({
				success: true,
				msg: `${monitors.length} monitor(s) ${action} successfully`,
				data: monitors,
			});
		} catch (error) {
			next(error);
		}
	};

	addDemoMonitors = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const id = requireUserId(req.user?.id);
			const teamId = requireTeamId(req.user?.teamId);
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

	getMonitorsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedQuery = getMonitorsByTeamIdQueryValidation.parse(req.query);

			const teamId = requireTeamId(req.user?.teamId);
			const type = validatedQuery.type;
			const filter = validatedQuery.filter;

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
			const validatedQuery = getMonitorsWithChecksQueryValidation.parse(req.query);

			const limit = validatedQuery.limit;
			const page = validatedQuery.page;
			const rowsPerPage = validatedQuery.rowsPerPage;
			const filter = validatedQuery.filter;
			const field = validatedQuery.field;
			const order = validatedQuery.order;
			const type = validatedQuery.type;
			const teamId = requireTeamId(req.user?.teamId);

			const monitors = await this.monitorService.getMonitorsWithChecksByTeamId({
				teamId,
				limit,
				type,
				page,
				rowsPerPage,
				filter,
				field,
				order,
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
			const teamId = requireTeamId(req.user?.teamId);
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
			const teamId = requireTeamId(req.user?.teamId);
			const groups = await this.monitorService.getGroupsByTeamId({ teamId });

			return res.status(200).json({
				msg: "Groups retrieved successfully",
				data: groups,
			});
		} catch (error) {
			next(error);
		}
	};

	updateNotifications = async (req: Request, res: Response, next: NextFunction) => {
		try {
			updateNotificationsValidation.parse(req.body);

			const teamId = requireTeamId(req.user?.teamId);
			const { monitorIds, notificationIds, action } = req.body;

			// Verify all requested notification IDs actually belong to this team
			const teamNotifications = await this.notificationsService.findNotificationsByTeamId(teamId);
			const validNotificationIds = teamNotifications.map((n) => n.id);

			const invalidIds = notificationIds.filter((id: string) => !validNotificationIds.includes(id));
			if (invalidIds.length > 0) {
				throw new AppError({
					message: `The following notification IDs are invalid or do not belong to your team: ${invalidIds.join(", ")}`,
					status: 403,
				});
			}

			const modifiedCount = await this.monitorService.updateNotifications({
				teamId,
				monitorIds,
				notificationIds,
				action,
			});

			return res.status(200).json({
				success: true,
				msg: `Notifications updated successfully on ${modifiedCount} monitor(s)`,
				data: { modifiedCount },
			});
		} catch (error) {
			next(error);
		}
	};
}

export default MonitorController;
