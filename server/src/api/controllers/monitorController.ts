import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { updateNotificationsValidation } from "@/api/validation/notificationValidation.js";
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
} from "@/api/validation/monitorValidation.js";
import sslChecker from "ssl-checker";
import { fetchMonitorCertificate, requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorService } from "@/domain/monitors/monitor.service.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";

const SERVICE_NAME = "monitorController";

export interface IMonitorController {
	getMonitorCertificate: RequestHandler;
	getUptimeDetailsById: RequestHandler;
	getHardwareDetailsById: RequestHandler;
	getPageSpeedDetailsById: RequestHandler;
	getGeoChecksByMonitorId: RequestHandler;
	getMonitorById: RequestHandler;
	createMonitor: RequestHandler;
	importMonitorsFromJSON: RequestHandler;
	deleteMonitor: RequestHandler;
	deleteAllMonitors: RequestHandler;
	editMonitor: RequestHandler;
	pauseMonitor: RequestHandler;
	bulkPauseMonitors: RequestHandler;
	addDemoMonitors: RequestHandler;
	getMonitorsByTeamId: RequestHandler;
	getMonitorsWithChecksByTeamId: RequestHandler;
	exportMonitorsToJSON: RequestHandler;
	getAllGames: RequestHandler;
	updateNotifications: RequestHandler;
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

	getMonitorCertificate = catchAsync(async (req: Request, res: Response) => {
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
	});

	getUptimeDetailsById = catchAsync(async (req: Request, res: Response) => {
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
	});

	getHardwareDetailsById = catchAsync(async (req: Request, res: Response) => {
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
	});
	getPageSpeedDetailsById = catchAsync(async (req: Request, res: Response) => {
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
	});

	getGeoChecksByMonitorId = catchAsync(async (req: Request, res: Response) => {
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
	});

	getMonitorById = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getMonitorByIdParamValidation.parse(req.params);

		const teamId = requireTeamId(req.user?.teamId);
		const monitorId = validatedParams.monitorId;

		const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });

		return res.status(200).json({
			success: true,
			msg: "Monitor retrieved successfully",
			data: monitor,
		});
	});

	createMonitor = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = createMonitorBodyValidation.parse(req.body);

		const userId = requireUserId(req.user?.id);
		const teamId = requireTeamId(req.user?.teamId);

		const monitor = await this.monitorService.createMonitor(teamId, userId, validatedBody);

		return res.status(200).json({
			success: true,
			msg: "Monitor created successfully",
			data: monitor,
		});
	});

	importMonitorsFromJSON = catchAsync(async (req: Request, res: Response) => {
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
	});

	deleteMonitor = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = getMonitorByIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const monitorId = validatedParams.monitorId;

		const deletedMonitor = await this.monitorService.deleteMonitor({ teamId, monitorId });

		return res.status(200).json({
			success: true,
			msg: "Monitor deleted successfully",
			data: deletedMonitor,
		});
	});

	deleteAllMonitors = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const deletedCount = await this.monitorService.deleteAllMonitors({ teamId });

		return res.status(200).json({
			success: true,
			msg: `Deleted ${deletedCount} monitors`,
		});
	});

	editMonitor = catchAsync(async (req: Request, res: Response) => {
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
	});

	pauseMonitor = catchAsync(async (req: Request, res: Response) => {
		const validatedParams = pauseMonitorParamValidation.parse(req.params);

		const monitorId = validatedParams.monitorId;
		const teamId = requireTeamId(req.user?.teamId);

		const monitor = await this.monitorService.pauseMonitor({ teamId, monitorId });

		return res.status(200).json({
			success: true,
			msg: monitor.isActive ? "Monitor resumed successfully" : "Monitor paused successfully",
			data: monitor,
		});
	});

	bulkPauseMonitors = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = bulkPauseMonitorBodyValidation.parse(req.body);

		const { monitorIds, pause } = validatedBody;
		const teamId = requireTeamId(req.user?.teamId);

		const { monitors, failedCount } = await this.monitorService.bulkPauseMonitors({ teamId, monitorIds, pause });

		const action = pause ? "paused" : "resumed";
		const monitorStr = monitors.length === 1 ? "monitor" : "monitors";

		let msg = `${monitors.length} ${monitorStr} ${action} successfully`;
		if (failedCount > 0) {
			msg = `${monitors.length} ${monitorStr} ${action} in database, but ${failedCount} failed to sync with the job queue. Please check logs.`;
		}

		return res.status(200).json({
			success: true,
			msg,
			data: { monitors, failedCount },
		});
	});

	addDemoMonitors = catchAsync(async (req: Request, res: Response) => {
		const id = requireUserId(req.user?.id);
		const teamId = requireTeamId(req.user?.teamId);
		const demoMonitors = await this.monitorService.addDemoMonitors({ userId: id, teamId });

		return res.status(200).json({
			success: true,
			msg: "Demo monitors added successfully",
			data: demoMonitors?.length ?? 0,
		});
	});

	getMonitorsByTeamId = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getMonitorsByTeamIdQueryValidation.parse(req.query);

		const teamId = requireTeamId(req.user?.teamId);
		const type = validatedQuery.type;
		const tags = validatedQuery.tags;
		const filter = validatedQuery.filter;

		const monitors = await this.monitorService.getMonitorsByTeamId({ teamId, type, tags, filter });

		return res.status(200).json({
			success: true,
			msg: "Monitors retrieved successfully",
			data: monitors,
		});
	});

	getMonitorsWithChecksByTeamId = catchAsync(async (req: Request, res: Response) => {
		const validatedQuery = getMonitorsWithChecksQueryValidation.parse(req.query);

		const limit = validatedQuery.limit;
		const page = validatedQuery.page;
		const rowsPerPage = validatedQuery.rowsPerPage;
		const filter = validatedQuery.filter;
		const field = validatedQuery.field;
		const order = validatedQuery.order;
		const type = validatedQuery.type;
		const tags = validatedQuery.tags;
		const teamId = requireTeamId(req.user?.teamId);

		const monitors = await this.monitorService.getMonitorsWithChecksByTeamId({
			teamId,
			limit,
			type,
			tags,
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
	});

	exportMonitorsToJSON = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const json = await this.monitorService.exportMonitorsToJSON({ teamId });

		return res.status(200).json({
			success: true,
			msg: "Monitors exported successfully",
			data: json,
		});
	});

	getAllGames = catchAsync(async (req: Request, res: Response) => {
		const games = this.monitorService.getAllGames();
		return res.status(200).json({
			success: true,
			msg: "Supported games retrieved successfully",
			data: games,
		});
	});

	updateNotifications = catchAsync(async (req: Request, res: Response) => {
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
	});
}

export default MonitorController;
