const SERVICE_NAME = "checkService";

class CheckService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, settingsService, stringService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
	}

	getChecksByMonitor = async ({ monitorId, query, teamId }) => {
		if (!monitorId) {
			throw new Error("No monitor ID in request");
		}

		if (!teamId) {
			throw new Error("No team ID in request");
		}

		const monitor = await this.db.getMonitorById(monitorId);

		if (!monitor) {
			const err = new Error("Monitor not found");
			err.status = 404;
			err.service = SERVICE_NAME;
			err.method = "getChecksByMonitor";
			throw err;
		}

		if (!monitor.teamId.equals(teamId)) {
			const err = new Error("Unauthorized");
			err.status = 403;
			err.service = SERVICE_NAME;
			err.method = "getChecksByMonitor";
			throw err;
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
			throw new Error("No team ID in request");
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
			throw new Error("No team ID in request");
		}

		const summary = await this.db.getChecksSummaryByTeamId({ teamId });
		return summary;
	};

	ackCheck = async ({ checkId, teamId, ack }) => {
		if (!checkId) {
			throw new Error("No check ID in request");
		}

		if (!teamId) {
			throw new Error("No team ID in request");
		}

		const updatedCheck = await this.db.ackCheck(checkId, teamId, ack);
		return updatedCheck;
	};

	ackAllChecks = async ({ monitorId, path, teamId, ack }) => {
		if (path === "monitor") {
			if (!monitorId) {
				throw new Error("No monitor ID in request");
			}

			const monitor = await this.db.getMonitorById(monitorId);
			if (!monitor) {
				throw new Error("Monitor not found");
			}

			if (!monitor.teamId.equals(teamId)) {
				const err = new Error("Unauthorized");
				err.status = 403;
				err.service = SERVICE_NAME;
				err.method = "ackAllChecks";
				throw err;
			}
		}

		const updatedChecks = await this.db.ackAllChecks(monitorId, teamId, ack, path);
		return updatedChecks;
	};

	deleteChecks = async ({ monitorId, teamId }) => {
		if (!monitorId) {
			throw new Error("No monitor ID in request");
		}

		if (!teamId) {
			throw new Error("No team ID in request");
		}

		const monitor = await this.db.getMonitorById(monitorId);

		if (!monitor) {
			const err = new Error("Monitor not found");
			err.status = 404;
			err.service = SERVICE_NAME;
			err.method = "deleteChecks";
			throw err;
		}

		if (!monitor.teamId.equals(teamId)) {
			const err = new Error("Unauthorized");
			err.status = 403;
			err.service = SERVICE_NAME;
			err.method = "deleteChecks";
			throw err;
		}

		const deletedCount = await this.db.deleteChecks(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }) => {
		if (!teamId) {
			throw new Error("No team ID in request");
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
