import { createMonitorsBodyValidation } from "../../validation/joi.js";

const SERVICE_NAME = "MonitorService";
class MonitorService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, settingsService, jobQueue, stringService, emailService, papaparse, logger, errorService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.jobQueue = jobQueue;
		this.stringService = stringService;
		this.emailService = emailService;
		this.papaparse = papaparse;
		this.logger = logger;
		this.errorService = errorService;
	}

	get serviceName() {
		return MonitorService.SERVICE_NAME;
	}

	verifyTeamAccess = async ({ teamId, monitorId }) => {
		const monitor = await this.db.monitorModule.getMonitorById(monitorId);
		if (!monitor?.teamId?.equals(teamId)) {
			throw this.errorService.createAuthorizationError();
		}
	};

	getAllMonitors = async () => {
		const monitors = await this.db.monitorModule.getAllMonitors();
		return monitors;
	};

	getUptimeDetailsById = async ({ teamId, monitorId, dateRange, normalize }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const data = await this.db.monitorModule.getUptimeDetailsById({
			monitorId,
			dateRange,
			normalize,
		});

		return data;
	};

	getMonitorStatsById = async ({ teamId, monitorId, limit, sortOrder, dateRange, numToDisplay, normalize }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitorStats = await this.db.monitorModule.getMonitorStatsById({
			monitorId,
			limit,
			sortOrder,
			dateRange,
			numToDisplay,
			normalize,
		});

		return monitorStats;
	};

	getHardwareDetailsById = async ({ teamId, monitorId, dateRange }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.getHardwareDetailsById({ monitorId, dateRange });

		return monitor;
	};

	getMonitorById = async ({ teamId, monitorId }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.monitorModule.getMonitorById(monitorId);

		return monitor;
	};

	createMonitor = async ({ teamId, userId, body }) => {
		const monitor = await this.db.createMonitor({
			body,
			teamId,
			userId,
		});

		this.jobQueue.addJob(monitor._id, monitor);
	};

	createBulkMonitors = async ({ fileData, userId, teamId }) => {
		const { parse } = this.papaparse;

		return new Promise((resolve, reject) => {
			parse(fileData, {
				header: true,
				skipEmptyLines: true,
				transform: (value, header) => {
					if (value === "") return undefined; // Empty fields become undefined

					// Handle 'port' and 'interval' fields, check if they're valid numbers
					if (["port", "interval"].includes(header)) {
						const num = parseInt(value, 10);
						if (isNaN(num)) {
							throw this.errorService.createBadRequestError(`${header} should be a valid number, got: ${value}`);
						}
						return num;
					}

					return value;
				},
				complete: async ({ data, errors }) => {
					try {
						if (errors.length > 0) {
							throw this.errorService.createServerError("Error parsing CSV");
						}

						if (!data || data.length === 0) {
							throw this.errorService.createServerError("CSV file contains no data rows");
						}

						const enrichedData = data.map((monitor) => ({
							userId,
							teamId,
							...monitor,
							description: monitor.description || monitor.name || monitor.url,
							name: monitor.name || monitor.url,
							type: monitor.type || "http",
						}));

						await createMonitorsBodyValidation.validateAsync(enrichedData);

						const monitors = await this.db.createBulkMonitors(enrichedData);

						await Promise.all(
							monitors.map(async (monitor) => {
								this.jobQueue.addJob(monitor._id, monitor);
							})
						);

						resolve(monitors);
					} catch (error) {
						reject(error);
					}
				},
			});
		});
	};

	deleteMonitor = async ({ teamId, monitorId }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.deleteMonitor({ teamId, monitorId });
		await this.jobQueue.deleteJob(monitor);
		await this.db.statusPageModule.deleteStatusPagesByMonitorId(monitor._id);
		return monitor;
	};

	deleteAllMonitors = async ({ teamId }) => {
		const { monitors, deletedCount } = await this.db.deleteAllMonitors(teamId);
		await Promise.all(
			monitors.map(async (monitor) => {
				try {
					await this.jobQueue.deleteJob(monitor);
					await this.db.checkModule.deleteChecks(monitor._id);
					await this.db.deletePageSpeedChecksByMonitorId(monitor._id);
					await this.db.deleteNotificationsByMonitorId(monitor._id);
				} catch (error) {
					this.logger.warn({
						message: `Error deleting associated records for monitor ${monitor._id} with name ${monitor.name}`,
						service: SERVICE_NAME,
						method: "deleteAllMonitors",
						stack: error.stack,
					});
				}
			})
		);
		return deletedCount;
	};

	editMonitor = async ({ teamId, monitorId, body }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const editedMonitor = await this.db.editMonitor({ monitorId, body });
		await this.jobQueue.updateJob(editedMonitor);
	};

	pauseMonitor = async ({ teamId, monitorId }) => {
		await this.verifyTeamAccess({ teamId, monitorId });
		const monitor = await this.db.pauseMonitor({ monitorId });
		monitor.isActive === true ? await this.jobQueue.resumeJob(monitor._id, monitor) : await this.jobQueue.pauseJob(monitor);
		return monitor;
	};

	addDemoMonitors = async ({ userId, teamId }) => {
		const demoMonitors = await this.db.addDemoMonitors(userId, teamId);
		await Promise.all(demoMonitors.map((monitor) => this.jobQueue.addJob(monitor._id, monitor)));
		return demoMonitors;
	};

	sendTestEmail = async ({ to }) => {
		const subject = this.stringService.testEmailSubject;
		const context = { testName: "Monitoring System" };

		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		const messageId = await this.emailService.sendEmail(to, subject, html);

		if (!messageId) {
			throw this.errorService.createServerError("Failed to send test email.");
		}

		return messageId;
	};

	getMonitorsByTeamId = async ({ teamId, limit, type, page, rowsPerPage, filter, field, order }) => {
		const monitors = await this.db.monitorModule.getMonitorsByTeamId({
			limit,
			type,
			page,
			rowsPerPage,
			filter,
			field,
			order,
			teamId,
		});
		return monitors;
	};

	getMonitorsAndSummaryByTeamId = async ({ teamId, type, explain }) => {
		const result = await this.db.monitorModule.getMonitorsAndSummaryByTeamId({
			type,
			explain,
			teamId,
		});
		return result;
	};

	getMonitorsWithChecksByTeamId = async ({ teamId, limit, type, page, rowsPerPage, filter, field, order, explain }) => {
		const result = await this.db.monitorModule.getMonitorsWithChecksByTeamId({
			limit,
			type,
			page,
			rowsPerPage,
			filter,
			field,
			order,
			teamId,
			explain,
		});
		return result;
	};

	exportMonitorsToCSV = async ({ teamId }) => {
		const monitors = await this.db.monitorModule.getMonitorsByTeamId({ teamId });

		if (!monitors || monitors.length === 0) {
			throw this.errorService.createNotFoundError("No monitors to export");
		}

		const csvData = monitors?.filteredMonitors?.map((monitor) => ({
			name: monitor.name,
			description: monitor.description,
			type: monitor.type,
			url: monitor.url,
			interval: monitor.interval,
			port: monitor.port,
			ignoreTlsErrors: monitor.ignoreTlsErrors,
			isActive: monitor.isActive,
		}));

		const csv = this.papaparse.unparse(csvData);
		return csv;
	};
}

export default MonitorService;
