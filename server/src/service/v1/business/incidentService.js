const SERVICE_NAME = "incidentService";

class IncidentService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, logger, errorService, stringService }) {
		this.db = db;
		this.logger = logger;
		this.errorService = errorService;
		this.stringService = stringService;
	}

	get serviceName() {
		return IncidentService.SERVICE_NAME;
	}

	createIncident = async (monitor, check) => {
		try {
			if (!monitor || !monitor._id) {
				throw this.errorService.createBadRequestError("Monitor is required");
			}

			if (!check || !check._id) {
				throw this.errorService.createBadRequestError("Check is required");
			}

			const activeIncident = await this.db.incidentModule.getActiveIncidentByMonitor(monitor._id);

			if (activeIncident) {
				await this.db.incidentModule.addCheckToIncident(activeIncident._id, check._id);

				this.logger.info({
					service: this.SERVICE_NAME,
					method: "createIncident",
					message: `Check added to existing active incident for monitor ${monitor.name}`,
					incidentId: activeIncident._id,
					monitorId: monitor._id,
				});

				return activeIncident;
			}

			const incidentData = {
				monitorId: monitor._id,
				teamId: monitor.teamId,
				type: monitor.type,
				startTime: new Date(),
				status: true,
				message: check.message || null,
				statusCode: check.statusCode || null,
				checks: [check._id],
			};

			const incident = await this.db.incidentModule.createIncident(incidentData);

			this.logger.info({
				service: this.SERVICE_NAME,
				method: "createIncident",
				message: `New incident created for monitor ${monitor.name}`,
				incidentId: incident._id,
				monitorId: monitor._id,
			});

			return incident;
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "createIncident",
				message: error.message,
				monitorId: monitor?._id,
				error: error.stack,
			});
			throw error;
		}
	};

	resolveIncident = async (monitor, check) => {
		try {
			if (!monitor || !monitor._id) {
				throw this.errorService.createBadRequestError("Monitor is required");
			}

			const activeIncident = await this.db.incidentModule.getActiveIncidentByMonitor(monitor._id);

			if (!activeIncident) {
				this.logger.info({
					service: this.SERVICE_NAME,
					method: "resolveIncident",
					message: `No active incident found for monitor ${monitor.name}`,
					monitorId: monitor._id,
				});
				return null;
			}

			await this.db.incidentModule.addCheckToIncident(activeIncident._id, check._id);

			const resolvedIncident = await this.db.incidentModule.resolveIncident(activeIncident._id, {
				resolutionType: "automatic",
				resolvedBy: null,
				endTime: new Date(),
			});

			this.logger.info({
				service: this.SERVICE_NAME,
				method: "resolveIncident",
				message: `Incident automatically resolved for monitor ${monitor.name}`,
				incidentId: resolvedIncident._id,
				monitorId: monitor._id,
			});

			return resolvedIncident;
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "resolveIncident",
				message: error.message,
				monitorId: monitor?._id,
				error: error.stack,
			});
			throw error;
		}
	};

	resolveIncidentManually = async ({ incidentId, userId, teamId, comment }) => {
		try {
			if (!incidentId) {
				throw this.errorService.createBadRequestError("No incident ID in request");
			}

			if (!userId) {
				throw this.errorService.createBadRequestError("No user ID in request");
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

			if (incident.status === false) {
				throw this.errorService.createBadRequestError("Incident is already resolved");
			}

			const resolvedIncident = await this.db.incidentModule.resolveIncident(incidentId, {
				resolutionType: "manual",
				resolvedBy: userId,
				comment: comment || null,
				endTime: new Date(),
			});

			this.logger.info({
				service: this.SERVICE_NAME,
				method: "resolveIncidentManually",
				message: `Incident manually resolved by user`,
				incidentId: resolvedIncident._id,
				userId,
			});

			return resolvedIncident;
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "resolveIncidentManually",
				message: error.message,
				incidentId,
				error: error.stack,
			});
			throw error;
		}
	};

	getIncidentsByTeam = async ({ teamId, query }) => {
		try {
			if (!teamId) {
				throw this.errorService.createBadRequestError("No team ID in request");
			}

			const { sortOrder, dateRange, page, rowsPerPage, status, monitorId, resolutionType } = query || {};

			const result = await this.db.incidentModule.getIncidentsByTeam({
				teamId,
				sortOrder,
				dateRange,
				page,
				rowsPerPage,
				status,
				monitorId,
				resolutionType,
			});

			return result;
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "getIncidentsByTeam",
				message: error.message,
				teamId,
				error: error.stack,
			});
			throw error;
		}
	};

	getIncidentSummary = async ({ teamId, query }) => {
		try {
			if (!teamId) {
				throw this.errorService.createBadRequestError("No team ID in request");
			}

			const { limit } = query || {};

			const summary = await this.db.incidentModule.getIncidentSummary({
				teamId,
				limit,
			});

			return summary;
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "getIncidentSummary",
				message: error.message,
				teamId,
				error: error.stack,
			});
			throw error;
		}
	};

	getIncidentById = async ({ incidentId, teamId }) => {
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
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "getIncidentById",
				message: error.message,
				incidentId,
				error: error.stack,
			});
			throw error;
		}
	};

	processIncidentsFromBuffer = async (incidentBufferItems) => {
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

			for (const item of resolveItems) {
				try {
					await this.resolveIncident(item.monitor, item.check);
				} catch (error) {
					this.logger.error({
						service: this.SERVICE_NAME,
						method: "processIncidentsFromBuffer",
						message: `Failed to resolve incident from buffer: ${error.message}`,
						monitorId: item.monitor?._id,
						error: error.stack,
					});
				}
			}

			if (createItems.length === 0) {
				return;
			}

			const groupedByMonitor = {};
			for (const item of createItems) {
				if (!item.monitor || !item.monitor._id || !item.check || !item.check._id) {
					this.logger.warn({
						service: this.SERVICE_NAME,
						method: "processIncidentsFromBuffer",
						message: "Skipping item with missing monitor or check data",
						item,
					});
					continue;
				}

				const monitorId = item.monitor._id.toString();
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

			const incidentsCreatedInFlush = {};
			const checksToAddToIncidents = [];
			const newIncidentsToCreate = [];

			for (const [monitorId, items] of Object.entries(groupedByMonitor)) {
				const existingIncident = activeIncidents.get(monitorId) || incidentsCreatedInFlush[monitorId];

				if (existingIncident) {
					const incidentId = existingIncident._id ? existingIncident._id.toString() : existingIncident;
					for (const item of items) {
						checksToAddToIncidents.push({
							incidentId,
							checkId: item.check._id.toString(),
						});
					}
				} else {
					const firstItem = items[0];
					const incidentData = {
						monitorId: firstItem.monitor._id,
						teamId: firstItem.monitor.teamId,
						type: firstItem.monitor.type,
						startTime: new Date(),
						status: true,
						message: firstItem.check.message || null,
						statusCode: firstItem.check.statusCode || null,
						checks: [firstItem.check._id],
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
								checkId: remainingItem.check._id.toString(),
							});
						}
					}
				}
			}

			if (checksToAddToIncidents.length > 0) {
				await this.db.incidentModule.addChecksToIncidentsBatch(checksToAddToIncidents);
			}

			this.logger.info({
				service: this.SERVICE_NAME,
				method: "processIncidentsFromBuffer",
				message: `Processed ${incidentBufferItems.length} incident buffer items`,
				created: newIncidentsToCreate.length,
				checksAdded: checksToAddToIncidents.length,
				resolved: resolveItems.length,
			});
		} catch (error) {
			this.logger.error({
				service: this.SERVICE_NAME,
				method: "processIncidentsFromBuffer",
				message: error.message,
				error: error.stack,
			});
			throw error;
		}
	};
}

export default IncidentService;
