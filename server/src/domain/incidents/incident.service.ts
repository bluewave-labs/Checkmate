import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { Check } from "@/domain/checks/check.type.js";
import { AppError } from "@/utils/AppError.js";
import { getDateForRange } from "@/utils/dataUtils.js";
import type { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import type { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import type { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import type { Incident, IncidentCause, IncidentStorageEvent, IncidentSummary, StorageIncidentEvent } from "@/domain/incidents/incident.type.js";
import type { StorageBreach } from "@/domain/storage/storage-alert.js";
import type { UserResponse } from "@/domain/users/user.type.js";
import type { MonitorActionDecision } from "@/worker/worker.interface.js";
import type { INotificationMessageBuilder } from "@/domain/notifications/notification.message-builder.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { DateRange } from "@/types/query.js";
import { incidentErrors } from "@/domain/incidents/incident.errors.js";

const SERVICE_NAME = "incidentService";
export interface IIncidentService {
	handleIncident(monitor: Monitor, decision: MonitorActionDecision, check: Check): Promise<Incident | null>;
	resolveIncident(incidentId: string, userId: string, teamId: string, comment?: string, userEmail?: string): Promise<Incident>;
	getIncidentsByTeam(
		teamId: string,
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined,
		monitorId: string | undefined,
		resolutionType: string | undefined
	): Promise<{ incidents: Incident[]; count: number }>;
	getIncidentSummary(teamId: string, limit?: number): Promise<IncidentSummary>;
	getIncidentById(incidentId: string, teamId: string): Promise<{ incident: Incident; monitor: Monitor; user: UserResponse | null }>;
	getStorageEvents(teamId: string, monitorId: string, subjects: string[]): Promise<StorageIncidentEvent[]>;
}

// A drive page shows the most recent storage events only
const STORAGE_EVENTS_LIMIT = 50;

const toStorageEvents = (breaches: StorageBreach[] | undefined, at: string): IncidentStorageEvent[] =>
	(breaches ?? []).map((breach) => ({ ...breach, at }));

const INCIDENT_CAUSE_BY_TRANSITION = {
	status_down: "down",
	threshold_breach: "threshold",
	storage_breach: "storage",
} as const satisfies Record<string, IncidentCause>;

export class IncidentService implements IIncidentService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private incidentsRepository: IIncidentsRepository;
	private monitorsRepository: IMonitorsRepository;
	private usersRepository: IUsersRepository;
	private notificationMessageBuilder: INotificationMessageBuilder;

	constructor(
		logger: ILogger,
		incidentsRepository: IIncidentsRepository,
		monitorsRepository: IMonitorsRepository,
		usersRepository: IUsersRepository,
		notificationMessageBuilder: INotificationMessageBuilder
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
		this.incidentsRepository = incidentsRepository;
		this.monitorsRepository = monitorsRepository;
		this.usersRepository = usersRepository;
		this.notificationMessageBuilder = notificationMessageBuilder;
	}

	handleIncident = async (monitor: Monitor, decision: MonitorActionDecision, check: Check): Promise<Incident | null> => {
		const { transition } = decision;
		if (transition === null) return null;

		const activeIncident = await this.incidentsRepository.findActiveByMonitorId(monitor.id, monitor.teamId);

		switch (transition) {
			case "status_down":
			case "threshold_breach":
			case "storage_breach": {
				const now = new Date().toISOString();
				if (activeIncident) {
					// A storage alert that joins an open incident is still logged on it, so the drive's page lists it
					const joined = transition === "storage_breach" ? toStorageEvents(decision.openedStorageBreaches, now) : [];
					if (joined.length === 0) return activeIncident;
					return await this.incidentsRepository.appendStorageEvents(activeIncident.id, activeIncident.teamId, joined);
				}
				// A threshold breach has no HTTP status
				const isBreach = transition !== "status_down";
				return await this.incidentsRepository.create({
					monitorId: monitor.id,
					teamId: monitor.teamId,
					startTime: Date.now().toString(),
					status: true,
					statusCode: isBreach ? 9999 : check.statusCode,
					cause: INCIDENT_CAUSE_BY_TRANSITION[transition],
					message: this.buildIncidentMessage(monitor, check, decision),
					storageEvents: transition === "storage_breach" ? toStorageEvents(decision.storageBreaches, now) : [],
				});
			}
			case "storage_resolved":
			case "threshold_resolved":
				// One kind of hardware problem cleared while the other keeps the monitor breached: the incident stays open
				if (monitor.status === "breached") return activeIncident;
			// falls through
			case "status_up": {
				if (!activeIncident) return null;
				activeIncident.status = false;
				activeIncident.endTime = Date.now().toString();
				activeIncident.resolutionType = "automatic";
				return await this.incidentsRepository.updateById(activeIncident.id, activeIncident.teamId, activeIncident);
			}
		}
	};

	private buildIncidentMessage = (monitor: Monitor, check: Check, decision: MonitorActionDecision): string | undefined => {
		switch (decision.transition) {
			case "threshold_breach":
				return this.notificationMessageBuilder.buildThresholdBreachMessage(monitor, check, decision.thresholdBreaches);
			case "storage_breach":
				return this.notificationMessageBuilder.buildStorageBreachMessage(decision.storageBreaches);
			default:
				return undefined;
		}
	};

	resolveIncident = async (incidentId: string, userId: string, teamId: string, comment?: string, userEmail?: string) => {
		try {
			const incident = await this.incidentsRepository.findActiveByIncidentId(incidentId, teamId);

			if (!incident) {
				throw new AppError(incidentErrors.notFound, { service: SERVICE_NAME });
			}

			if (incident.status === false) {
				throw new AppError(incidentErrors.alreadyResolved, { service: SERVICE_NAME });
			}

			incident.resolutionType = "manual";
			incident.status = false;
			incident.resolvedBy = userId;
			incident.resolvedByEmail = userEmail || null;
			incident.comment = comment || null;
			incident.endTime = Date.now().toString();

			const resolvedIncident = await this.incidentsRepository.updateById(incident.id, teamId, incident);

			this.logger.debug({ incidentId: resolvedIncident.id }, "Incident manually resolved by user");

			return resolvedIncident;
		} catch (error: unknown) {
			this.logger.error({ err: error, incidentId }, "Failed to resolve incident");
			throw error;
		}
	};

	getIncidentsByTeam = async (
		teamId: string,
		sortOrder: string,
		dateRange: DateRange,
		page: number,
		rowsPerPage: number,
		status: boolean | undefined,
		monitorId: string | undefined,
		resolutionType: string | undefined
	) => {
		try {
			const startDate = getDateForRange(dateRange);
			const parsedPage = page ?? 0;
			const parsedRowsPerPage = rowsPerPage ?? 20;

			const incidents = await this.incidentsRepository.findByTeamId(
				teamId,
				startDate,
				parsedPage,
				parsedRowsPerPage,
				sortOrder,
				status,
				monitorId,
				resolutionType
			);

			const count = await this.incidentsRepository.countByTeamId(teamId, startDate, status, monitorId, resolutionType);

			return { incidents, count };
		} catch (error: unknown) {
			this.logger.error({ err: error, teamId }, "Failed to get incidents for team");
			throw error;
		}
	};

	getIncidentSummary = async (teamId: string, limit?: number) => {
		try {
			const parsedLimit = limit ?? 10;
			const summary = await this.incidentsRepository.findSummaryByTeamId(teamId, parsedLimit);

			return summary;
		} catch (error: unknown) {
			this.logger.error({ err: error, teamId }, "Failed to get incident summary");
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
		} catch (error: unknown) {
			this.logger.error({ err: error, incidentId }, "Failed to get incident");
			throw error;
		}
	};

	getStorageEvents = async (teamId: string, monitorId: string, subjects: string[]) => {
		try {
			return await this.incidentsRepository.findStorageEvents(monitorId, teamId, subjects, STORAGE_EVENTS_LIMIT);
		} catch (error: unknown) {
			this.logger.error({ err: error, monitorId }, "Failed to get storage incident events");
			throw error;
		}
	};
}
