const SERVICE_NAME = "checkService";

class CheckService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, settingsService, stringService, errorService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
		this.errorService = errorService;
	}

	getChecksByMonitor = async ({ monitorId, query, teamId }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const monitor = await this.db.getMonitorById(monitorId);

		if (!monitor) {
			throw this.errorService.createNotFoundError("Monitor not found");
		}

		if (!monitor.teamId.equals(teamId)) {
			throw this.errorService.createAuthorizationError();
		}

		let { type, sortOrder, dateRange, filter, ack, page, rowsPerPage, status } = query;
		const result = await this.db.getChecksByMonitor({
			monitorId,
			type,
			sortOrder,
			dateRange,
			filter,
			ack,
			page,
			rowsPerPage,
			status,
		});
		return result;
	};

	getChecksByTeam = async ({ teamId, query }) => {
		let { sortOrder, dateRange, filter, ack, page, rowsPerPage } = query;

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const checkData = await this.db.getChecksByTeam({
			sortOrder,
			dateRange,
			filter,
			ack,
			page,
			rowsPerPage,
			teamId,
		});
		return checkData;
	};

	getChecksSummaryByTeamId = async ({ teamId }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const summary = await this.db.getChecksSummaryByTeamId({ teamId });
		return summary;
	};

	ackCheck = async ({ checkId, teamId, ack }) => {
		if (!checkId) {
			throw this.errorService.createBadRequestError("No check ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const updatedCheck = await this.db.ackCheck(checkId, teamId, ack);
		return updatedCheck;
	};

	ackAllChecks = async ({ monitorId, path, teamId, ack }) => {
		if (path === "monitor") {
			if (!monitorId) {
				throw this.errorService.createBadRequestError("No monitor ID in request");
			}

			const monitor = await this.db.getMonitorById(monitorId);
			if (!monitor) {
				throw this.errorService.createNotFoundError("Monitor not found");
			}

			if (!monitor.teamId.equals(teamId)) {
				throw this.errorService.createAuthorizationError();
			}
		}

		const updatedChecks = await this.db.ackAllChecks(monitorId, teamId, ack, path);
		return updatedChecks;
	};

	deleteChecks = async ({ monitorId, teamId }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const monitor = await this.db.getMonitorById(monitorId);

		if (!monitor) {
			throw this.errorService.createNotFoundError("Monitor not found");
		}

		if (!monitor.teamId.equals(teamId)) {
			throw this.errorService.createAuthorizationError();
		}

		const deletedCount = await this.db.deleteChecks(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const deletedCount = await this.db.deleteChecksByTeamId(teamId);
		return deletedCount;
	};

	updateChecksTTL = async ({ teamId, ttl }) => {
		const SECONDS_PER_DAY = 86400;
		const newTTL = parseInt(ttl, 10) * SECONDS_PER_DAY;
		await this.db.updateChecksTTL(teamId, newTTL);
	};
}

export default CheckService;
