import { Request, Response, RequestHandler } from "express";
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
	getDomainParamValidation,
	getHardwareDetailsByIdParamValidation,
	getHardwareDetailsByIdQueryValidation,
	getUptimeDetailsByIdParamValidation,
	getUptimeDetailsByIdQueryValidation,
	importMonitorsBodyValidation,
	bulkPauseMonitorBodyValidation,
	getDockerDetailsByIdParamValidation,
	getDockerDetailsByIdQueryValidation,
	getDockerContainerNameParamValidation,
	getDockerContainerByNameQueryValidation,
	getDockerContainerLogsQueryValidation,
} from "@/api/validation/monitorValidation.js";
import sslChecker from "ssl-checker";
import * as whoiser from "whoiser";
import { fetchMonitorCertificate, fetchMonitorDomain, requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import { AppError } from "@/utils/AppError.js";
import { IMonitorService } from "@/domain/monitors/monitor.service.js";
import { INotificationsService } from "@/domain/notifications/notification.service.js";

export interface IMonitorController {
	getMonitorCertificate: RequestHandler;
	getMonitorDomain: RequestHandler;
	getUptimeDetailsById: RequestHandler;
	getHardwareDetailsById: RequestHandler;
	getPageSpeedDetailsById: RequestHandler;
	getDockerDetailsById: RequestHandler;
	getDockerContainerByName: RequestHandler;
	getDockerContainerLogs: RequestHandler;
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
	private monitorService: IMonitorService;
	private notificationsService: INotificationsService;

	constructor(monitorService: IMonitorService, notificationsService: INotificationsService) {
		this.monitorService = monitorService;
		this.notificationsService = notificationsService;
	}

	getMonitorCertificate = async (req: Request, res: Response) => {
		const { monitorId } = getCertificateParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });
		const certificate = await fetchMonitorCertificate(sslChecker, monitor);
		const data = { certificateDate: new Date(certificate.validTo) };
		res.json({ success: true, msg: "SSL certificate retrieved successfully", data });
	};

	getMonitorDomain = async (req: Request, res: Response) => {
		const { monitorId } = getDomainParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const monitor = await this.monitorService.getMonitorById({ teamId, monitorId });
		const domainExpiry = await fetchMonitorDomain(whoiser, monitor);
		const data = { domain: domainExpiry.domain, expiryDate: domainExpiry.expiryDate === null ? null : new Date(domainExpiry.expiryDate) };
		res.json({ success: true, msg: "Domain expiry retrieved successfully", data });
	};

	getUptimeDetailsById = async (req: Request, res: Response) => {
		const { monitorId } = getUptimeDetailsByIdParamValidation.parse(req.params);
		const { dateRange } = getUptimeDetailsByIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getUptimeDetailsById({ teamId, monitorId, dateRange });
		res.json({ success: true, msg: "Uptime details retrieved successfully", data });
	};

	getHardwareDetailsById = async (req: Request, res: Response) => {
		const { monitorId } = getHardwareDetailsByIdParamValidation.parse(req.params);
		const { dateRange } = getHardwareDetailsByIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getHardwareDetailsById({
			teamId,
			monitorId,
			dateRange,
		});

		res.json({ success: true, msg: "Hardware details retrieved successfully", data });
	};

	getPageSpeedDetailsById = async (req: Request, res: Response) => {
		const { monitorId } = getHardwareDetailsByIdParamValidation.parse(req.params);
		const { dateRange } = getHardwareDetailsByIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getPageSpeedDetailsById({ teamId, monitorId, dateRange });

		res.json({ success: true, msg: "Page speed details retrieved successfully", data });
	};

	getDockerDetailsById = async (req: Request, res: Response) => {
		const { monitorId } = getDockerDetailsByIdParamValidation.parse(req.params);
		const { dateRange } = getDockerDetailsByIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getDockerDetailsById({ teamId, monitorId, dateRange });
		res.json({ success: true, msg: "Docker details retrieved successfully", data });
	};

	getDockerContainerByName = async (req: Request, res: Response) => {
		const { monitorId, containerName } = getDockerContainerNameParamValidation.parse(req.params);
		const { dateRange } = getDockerContainerByNameQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getDockerContainerByName({ teamId, monitorId, containerName, dateRange });
		res.json({ success: true, msg: "Docker container retrieved successfully", data });
	};

	getDockerContainerLogs = async (req: Request, res: Response) => {
		const { monitorId, containerName } = getDockerContainerNameParamValidation.parse(req.params);
		const { before, after, limit } = getDockerContainerLogsQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getDockerContainerLogs({ teamId, monitorId, containerName, before, after, limit });
		res.json({ success: true, msg: "Docker container logs retrieved successfully", data });
	};

	getGeoChecksByMonitorId = async (req: Request, res: Response) => {
		const { monitorId } = getMonitorByIdParamValidation.parse(req.params);
		const { dateRange, continent } = getMonitorByIdQueryValidation.parse(req.query);
		const continents = continent ? (Array.isArray(continent) ? continent : [continent]) : undefined;
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getGeoChecksByMonitorId({ teamId, monitorId, dateRange, continents });
		res.json({ success: true, msg: "Geo checks retrieved successfully", data });
	};

	getMonitorById = async (req: Request, res: Response) => {
		const { monitorId } = getMonitorByIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getMonitorById({ teamId, monitorId });
		res.json({ success: true, msg: "Monitor retrieved successfully", data });
	};

	createMonitor = async (req: Request, res: Response) => {
		const validatedBody = createMonitorBodyValidation.parse(req.body);
		const userId = requireUserId(req.user?.id);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.createMonitor(teamId, userId, validatedBody);
		res.status(201).json({ success: true, msg: "Monitor created successfully", data });
	};

	importMonitorsFromJSON = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const userId = requireUserId(req.user?.id);
		const { monitors } = importMonitorsBodyValidation.parse(req.body);
		const data = await this.monitorService.importMonitorsFromJSON({ teamId, userId, monitors });
		res.json({ success: true, msg: `Successfully imported ${data.imported} monitor(s)`, data });
	};

	deleteMonitor = async (req: Request, res: Response) => {
		const { monitorId } = getMonitorByIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.deleteMonitor({ teamId, monitorId });
		res.json({ success: true, msg: "Monitor deleted successfully", data });
	};

	deleteAllMonitors = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const deletedCount = await this.monitorService.deleteAllMonitors({ teamId });
		res.json({ success: true, msg: `Deleted ${deletedCount} monitors` });
	};

	editMonitor = async (req: Request, res: Response) => {
		const { monitorId } = getMonitorByIdParamValidation.parse(req.params);
		const body = editMonitorBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.editMonitor({ teamId, monitorId, body });
		res.json({ success: true, msg: "Monitor edited successfully", data });
	};

	pauseMonitor = async (req: Request, res: Response) => {
		const { monitorId } = pauseMonitorParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.pauseMonitor({ teamId, monitorId });
		const msg = data.isActive ? "Monitor resumed successfully" : "Monitor paused successfully";
		res.json({ success: true, msg, data });
	};

	bulkPauseMonitors = async (req: Request, res: Response) => {
		const { monitorIds, pause } = bulkPauseMonitorBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const { monitors, failedCount } = await this.monitorService.bulkPauseMonitors({ teamId, monitorIds, pause });
		const action = pause ? "paused" : "resumed";
		const monitorStr = monitors.length === 1 ? "monitor" : "monitors";
		let msg = `${monitors.length} ${monitorStr} ${action} successfully`;
		if (failedCount > 0) {
			msg = `${monitors.length} ${monitorStr} ${action} in database, but ${failedCount} failed to sync with the job queue. Please check logs.`;
		}
		const data = { monitors, failedCount };
		res.json({ success: true, msg, data });
	};

	addDemoMonitors = async (req: Request, res: Response) => {
		const id = requireUserId(req.user?.id);
		const teamId = requireTeamId(req.user?.teamId);
		const demoMonitors = await this.monitorService.addDemoMonitors({ userId: id, teamId });
		const data = demoMonitors?.length ?? 0;
		res.json({ success: true, msg: "Demo monitors added successfully", data });
	};

	getMonitorsByTeamId = async (req: Request, res: Response) => {
		const { type, tags, filter } = getMonitorsByTeamIdQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getMonitorsByTeamId({ teamId, type, tags, filter });
		res.json({ success: true, msg: "Monitors retrieved successfully", data });
	};

	getMonitorsWithChecksByTeamId = async (req: Request, res: Response) => {
		const { limit, page, rowsPerPage, filter, field, order, type, tags } = getMonitorsWithChecksQueryValidation.parse(req.query);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.getMonitorsWithChecksByTeamId({ teamId, limit, type, tags, page, rowsPerPage, filter, field, order });
		res.json({ success: true, msg: "Monitors retrieved successfully", data });
	};

	exportMonitorsToJSON = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.monitorService.exportMonitorsToJSON({ teamId });
		res.json({ success: true, msg: "Monitors exported successfully", data });
	};

	getAllGames = async (req: Request, res: Response) => {
		const data = this.monitorService.getAllGames();
		res.json({ success: true, msg: "Supported games retrieved successfully", data });
	};

	updateNotifications = async (req: Request, res: Response) => {
		const { monitorIds, notificationIds, action } = updateNotificationsValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);

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

		res.json({ success: true, msg: `Notifications updated successfully on ${modifiedCount} monitor(s)`, data: { modifiedCount } });
	};
}

export default MonitorController;
