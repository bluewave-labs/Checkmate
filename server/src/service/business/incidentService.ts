const SERVICE_NAME = "incidentService";
import type { Monitor } from "@/types/monitor.js";
import type { MonitorStatusResponse } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ParseBoolean } from "@/utils/utils.js";
import type { IIncidentsRepository, IMonitorsRepository, IUsersRepository } from "@/repositories/index.js";
import type { Incident } from "@/types/index.js";
import type { MonitorActionDecision } from "@/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.js";
import type { INotificationMessageBuilder } from "@/service/infrastructure/notificationMessageBuilder.js";

const dateRangeLookup: Record<string, Date | undefined> = {
	recent: new Date(new Date().setHours(new Date().getHours() - 2)),
	hour: new Date(new Date().setHours(new Date().getHours() - 1)),
	day: new Date(new Date().setDate(new Date().getDate() - 1)),
	week: new Date(new Date().setDate(new Date().getDate() - 7)),
	month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
	all: undefined,
};

class IncidentService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private incidentsRepository: IIncidentsRepository;
	private monitorsRepository: IMonitorsRepository;
	private usersRepository: IUsersRepository;
	private notificationMessageBuilder: INotificationMessageBuilder;

	constructor({
		logger,
		incidentsRepository,
		monitorsRepository,
		usersRepository,
		notificationMessageBuilder,
	}: {
		logger: any;
		incidentsRepository: IIncidentsRepository;
		monitorsRepository: IMonitorsRepository;
		usersRepository: IUsersRepository;
		notificationMessageBuilder: INotificationMessageBuilder;
	}) {
		this.logger = logger;
		this.incidentsRepository = incidentsRepository;
		this.monitorsRepository = monitorsRepository;
		this.usersRepository = usersRepository;
		this.notificationMessageBuilder = notificationMessageBuilder;
	}

	get serviceName() {
		return IncidentService.SERVICE_NAME;
	}

	handleIncident = async (
		monitor: Monitor,
		code: number,
		decision: MonitorActionDecision,
		monitorStatusResponse?: MonitorStatusResponse
	): Promise<Incident | null> => {
		if (!decision.shouldCreateIncident && !decision.shouldResolveIncident) {
			return null;
		}

		const activeIncident = await this.incidentsRepository.findActiveByMonitorId(monitor.id, monitor.teamId);

		if (decision.shouldCreateIncident) {
			if (activeIncident) {
				return activeIncident;
			} else {
				let statusCode = code;
				let message: string | undefined;

				// For threshold breaches, use 9999 status code and build descriptive message
				if (decision.incidentReason === "threshold_breach") {
					statusCode = 9999;
					message = this.buildThresholdBreachMessage(monitor, monitorStatusResponse);
				}

				const incident = {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					startTime: Date.now().toString(),
					status: true,
					statusCode,
					message,
				};
				return await this.incidentsRepository.create(incident);
			}
		}

		if (decision.shouldResolveIncident) {
			if (!activeIncident) {
				return null;
			}
			activeIncident.status = false;
			activeIncident.endTime = Date.now().toString();
			activeIncident.resolutionType = "automatic";
			return await this.incidentsRepository.updateById(activeIncident.id, activeIncident.teamId, activeIncident);
		}

		return null;
	};

	private buildThresholdBreachMessage(monitor: Monitor, monitorStatusResponse?: MonitorStatusResponse): string {
		if (!monitorStatusResponse) {
			return "Threshold breach detected";
		}

		const breaches = this.notificationMessageBuilder.extractThresholdBreaches(monitor, monitorStatusResponse);

		if (breaches.length === 0) {
			return "Threshold breach detected";
		}

		return breaches.map((b) => `${b.metric.toUpperCase()}: ${b.formattedValue} (threshold: ${b.threshold}${b.unit})`).join(", ");
	}

	resolveIncident = async (incidentId: string, userId: string, teamId: string, comment?: string, userEmail?: string) => {
		try {
			if (!incidentId) {
				throw new AppError({ message: "No incident ID in request", service: SERVICE_NAME, method: "resolveIncident" });
			}

			if (!userId) {
				throw new AppError({ message: "No user ID in request", service: SERVICE_NAME, method: "resolveIncident" });
			}

			if (!teamId) {
				throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "resolveIncident" });
			}

			const incident = await this.incidentsRepository.findActiveByIncidentId(incidentId, teamId);

			if (!incident) {
				throw new AppError({ message: "Incident not found", service: SERVICE_NAME, method: "resolveIncident" });
			}

			if (incident.status === false) {
				throw new AppError({ message: "Incident is already resolved", service: SERVICE_NAME, method: "resolveIncident" });
			}

			incident.resolutionType = "manual";
			incident.status = false;
			incident.resolvedBy = userId;
			incident.resolvedByEmail = userEmail || null;
			incident.comment = comment || null;
			incident.endTime = Date.now().toString();

			const resolvedIncident = await this.incidentsRepository.updateById(incident.id, teamId, incident);

			this.logger.debug({
				service: SERVICE_NAME,
				method: "resolveIncidentManually",
				message: `Incident manually resolved by user`,
				details: resolvedIncident.id,
			});

			return resolvedIncident;
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "resolveIncident",
				message: error.message,
				details: incidentId,
				stack: error.stack,
			});
			throw error;
		}
	};

	getIncidentsByTeam = async (
		teamId: string,
		sortOrder: string,
		dateRange: string,
		page: string,
		rowsPerPage: string,
		status: string,
		monitorId: string,
		resolutionType: string
	) => {
		try {
			if (!teamId) {
				throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getIncidentsByTeam", status: 400 });
			}

			const startDate = dateRangeLookup[dateRange];

			const parsedPage = Number.isFinite(parseInt(page)) ? parseInt(page) : 0;
			const parsedRowsPerPage = Number.isFinite(parseInt(rowsPerPage)) ? parseInt(rowsPerPage) : 20;
			const parsedStatus = typeof status === "undefined" ? undefined : ParseBoolean(status);

			const incidents = await this.incidentsRepository.findByTeamId(
				teamId,
				startDate,
				parsedPage,
				parsedRowsPerPage,
				sortOrder,
				parsedStatus,
				monitorId,
				resolutionType
			);

			const count = await this.incidentsRepository.countByTeamId(teamId, startDate, parsedStatus, monitorId, resolutionType);

			return { incidents, count };
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "getIncidentsByTeam",
				message: error.message,
				details: teamId,
				stack: error.stack,
			});
			throw error;
		}
	};

	getIncidentSummary = async (teamId: string, limit?: string) => {
		try {
			if (!teamId) {
				throw new AppError({ message: "No team ID in request", service: SERVICE_NAME, method: "getIncidentSummary", status: 400 });
			}

			const parsedLimit = limit && Number.isFinite(parseInt(limit, 10)) ? parseInt(limit, 10) : 10;
			const summary = await this.incidentsRepository.findSummaryByTeamId(teamId, parsedLimit);

			return summary;
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "getIncidentSummary",
				message: error.message,
				details: teamId,
				stack: error.stack,
			});
			throw error;
		}
	};

	getIncidentById = async (incidentId: string, teamId: string) => {
		try {
			const incident = await this.incidentsRepository.findById(incidentId, teamId);
			const monitor = await this.monitorsRepository.findById(incident.monitorId, teamId);
			let user = null;
			if (incident.resolvedBy) {
				user = await this.usersRepository.findById(incident.resolvedBy);
			}
			return { incident, monitor, user };
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "getIncidentById",
				message: error.message,
				details: incidentId,
				stack: error.stack,
			});
			throw error;
		}
	};
}

export default IncidentService;
