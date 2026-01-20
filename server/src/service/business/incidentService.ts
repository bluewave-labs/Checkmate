const SERVICE_NAME = "incidentService";
import type { Monitor } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { ParseBoolean } from "@/utils/utils.js";
import type { IIncidentsRepository } from "@/repositories/index.js";
import type { Incident } from "@/types/index.js";

const dateRangeLookup: Record<string, Date | undefined> = {
	recent: new Date(new Date().setDate(new Date().getDate() - 2)),
	hour: new Date(new Date().setHours(new Date().getHours() - 1)),
	day: new Date(new Date().setDate(new Date().getDate() - 1)),
	week: new Date(new Date().setDate(new Date().getDate() - 7)),
	month: new Date(new Date().setMonth(new Date().getMonth() - 1)),
	all: undefined,
};

class IncidentService {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private logger: any;
	private errorService: any;
	private stringService: any;
	private incidentsRepository: IIncidentsRepository;

	constructor({
		db,
		logger,
		errorService,
		stringService,
		incidentsRepository,
	}: {
		db: any;
		logger: any;
		errorService: any;
		stringService: any;
		incidentsRepository: IIncidentsRepository;
	}) {
		this.db = db;
		this.logger = logger;
		this.errorService = errorService;
		this.stringService = stringService;
		this.incidentsRepository = incidentsRepository;
	}

	get serviceName() {
		return IncidentService.SERVICE_NAME;
	}

	handleIncident = async (monitor: Monitor, code: number): Promise<Incident | null> => {
		const activeIncident = await this.incidentsRepository.findActiveByMonitorId(monitor.id, monitor.teamId);
		// Monitor is down, create an incident
		if (monitor.status === false) {
			if (activeIncident) {
				return activeIncident;
			} else {
				const incident = {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					startTime: Date.now().toString(),
					status: true,
					statusCode: code,
				};
				return await this.incidentsRepository.create(incident);
			}
		}

		// Monitor is up, resolve active incidents
		if (!activeIncident) {
			return null;
		}
		activeIncident.status = false;
		activeIncident.endTime = Date.now().toString();
		activeIncident.resolutionType = "automatic";
		return await this.incidentsRepository.updateById(activeIncident.id, activeIncident.teamId, activeIncident);
	};

	resolveIncident = async (incidentId: string, userId: string, teamId: string, comment?: string) => {
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

	getIncidentsByTeam = async ({ teamId, query }: { teamId: string; query?: any }) => {
		try {
			if (!teamId) {
				throw this.errorService.createBadRequestError("No team ID in request");
			}

			const { sortOrder, dateRange, page, rowsPerPage, status, monitorId, resolutionType } = query || {};
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
				throw this.errorService.createBadRequestError(" team ID in request");
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

	getIncidentById = async ({ incidentId, teamId }: { incidentId: string; teamId: string }) => {
		try {
			if (!incidentId) {
				throw this.errorService.createBadRequestError("No incident ID in request");
			}

			if (!teamId) {
				throw this.errorService.createBadRequestError("No team ID in request");
			}

			const incident = await this.db.incidentModule.getIncidentById(incidentId);

			if (!incident) {
				throw this.errorService.createNotFoundError("Incident not found");
			}

			if (!incident.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}

			return incident;
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

	processIncidentsFromBuffer = async (incidentBufferItems: any[]) => {
		try {
			if (!incidentBufferItems || incidentBufferItems.length === 0) {
				return;
			}

			const createItems = [];
			const resolveItems = [];

			for (const item of incidentBufferItems) {
				if (item.action === "resolve") {
					resolveItems.push(item);
				} else {
					createItems.push(item);
				}
			}

			for (const item of resolveItems as any[]) {
				try {
					await this.resolveIncidentForMonitor(item.monitor);
				} catch (error: any) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "processIncidentsFromBuffer",
						message: `Failed to resolve incident from buffer: ${error.message}`,
						monitorId: item.monitor?._id,
						stack: error.stack,
					});
				}
			}

			if (createItems.length === 0) {
				return;
			}

			const groupedByMonitor: Record<string, any[]> = {};
			for (const item of createItems) {
				if (!item.monitor || !item.monitor.id || !item.check || !item.check.id) {
					this.logger.warn({
						service: SERVICE_NAME,
						method: "processIncidentsFromBuffer",
						message: "Skipping item with missing monitor or check data",
						item,
					});
					continue;
				}

				const monitorId = item.monitor.id.toString();
				if (!groupedByMonitor[monitorId]) {
					groupedByMonitor[monitorId] = [];
				}
				groupedByMonitor[monitorId].push(item);
			}

			const monitorIds = Object.keys(groupedByMonitor);
			if (monitorIds.length === 0) {
				return;
			}

			const activeIncidents = await this.db.incidentModule.getActiveIncidentsByMonitors(monitorIds);

			const incidentsCreatedInFlush: Record<string, any> = {};
			const checksToAddToIncidents = [];
			const newIncidentsToCreate = [];

			for (const [monitorId, items] of Object.entries(groupedByMonitor)) {
				const existingIncident = activeIncidents.get(monitorId) || incidentsCreatedInFlush[monitorId];

				if (existingIncident) {
					const incidentId = existingIncident._id ? existingIncident._id.toString() : existingIncident;
					for (const item of items) {
						checksToAddToIncidents.push({
							incidentId,
							checkId: item.check.id.toString(),
						});
					}
				} else {
					const firstItem = items[0];
					const incidentData = {
						monitorId: firstItem.monitor.id,
						teamId: firstItem.monitor.teamId,
						type: firstItem.monitor.type,
						startTime: new Date(),
						status: true,
						message: firstItem.check.message || null,
						statusCode: firstItem.check.statusCode || null,
						checks: [firstItem.check.id],
					};

					newIncidentsToCreate.push({
						incidentData,
						monitorId,
						remainingChecks: items.slice(1), // Checks restantes para agregar después
					});
				}
			}

			if (newIncidentsToCreate.length > 0) {
				const incidentDataArray = newIncidentsToCreate.map((item) => item.incidentData);
				await this.db.incidentModule.createIncidents(incidentDataArray);

				const createdIncidentsMap = await this.db.incidentModule.getActiveIncidentsByMonitors(newIncidentsToCreate.map((item) => item.monitorId));

				for (const item of newIncidentsToCreate) {
					const createdIncident = createdIncidentsMap.get(item.monitorId);
					if (createdIncident && createdIncident._id) {
						const incidentId = createdIncident._id.toString();
						incidentsCreatedInFlush[item.monitorId] = incidentId;

						for (const remainingItem of item.remainingChecks) {
							checksToAddToIncidents.push({
								incidentId,
								checkId: remainingItem.check.id,
							});
						}
					}
				}
			}

			if (checksToAddToIncidents.length > 0) {
				await this.db.incidentModule.addChecksToIncidentsBatch(checksToAddToIncidents);
			}

			this.logger.info({
				service: SERVICE_NAME,
				method: "processIncidentsFromBuffer",
				message: `Processed ${incidentBufferItems.length} incident buffer items`,
				created: newIncidentsToCreate.length,
				checksAdded: checksToAddToIncidents.length,
				resolved: resolveItems.length,
			});
		} catch (error: any) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "processIncidentsFromBuffer",
				message: error.message,
				stack: error.stack,
			});
			throw error;
		}
	};

	private resolveIncidentForMonitor = async (monitor: Monitor) => {
		if (!monitor?.id) {
			return;
		}
		const incident = await this.incidentsRepository.findActiveByMonitorId(monitor.id, monitor.teamId);
		if (!incident) {
			return;
		}
		incident.status = false;
		incident.endTime = new Date().toISOString();
		incident.resolutionType = "automatic";
		await this.incidentsRepository.updateById(incident.id, incident.teamId, incident);
	};
}

export default IncidentService;
