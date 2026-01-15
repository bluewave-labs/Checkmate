import { IMonitorsRepository } from "@/repositories/index.js";
import type { MonitorType } from "@/types/index.js";

const SERVICE_NAME = "checkService";

class CheckService {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private settingsService: any;
	private stringService: any;
	private errorService: any;
	private monitorsRepository: IMonitorsRepository;

	constructor({
		db,
		settingsService,
		stringService,
		errorService,
		monitorsRepository,
	}: {
		db: any;
		settingsService: any;
		stringService: any;
		errorService: any;
		monitorsRepository: IMonitorsRepository;
	}) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
		this.errorService = errorService;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return CheckService.SERVICE_NAME;
	}

	buildCheck = async (statusResponse: any, type: MonitorType) => {};

	getChecksByMonitor = async ({ monitorId, query, teamId }: { monitorId: string; query: any; teamId: string }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		let { sortOrder, dateRange, filter, ack, page, rowsPerPage, status } = query;
		const result = await this.db.checkModule.getChecksByMonitor({
			monitorId,
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

	getChecksByTeam = async ({ teamId, query }: { teamId: string; query: any }) => {
		let { sortOrder, dateRange, filter, ack, page, rowsPerPage } = query;

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const checkData = await this.db.checkModule.getChecksByTeam({
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

	getChecksSummaryByTeamId = async ({ teamId }: { teamId: string }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const summary = await this.db.checkModule.getChecksSummaryByTeamId({ teamId });
		return summary;
	};

	ackCheck = async ({ checkId, teamId, ack }: { checkId: string; teamId: string; ack: any }) => {
		if (!checkId) {
			throw this.errorService.createBadRequestError("No check ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const updatedCheck = await this.db.checkModule.ackCheck(checkId, teamId, ack);
		return updatedCheck;
	};

	ackAllChecks = async ({ monitorId, path, teamId, ack }: { monitorId: string; path: string; teamId: string; ack: any }) => {
		if (path === "monitor") {
			if (!monitorId) {
				throw this.errorService.createBadRequestError("No monitor ID in request");
			}

			// For verificaiton, throws an error if monitor doesn't belong to team
			await this.monitorsRepository.findById(monitorId, teamId);
		}

		const updatedChecks = await this.db.checkModule.ackAllChecks(monitorId, teamId, ack, path);
		return updatedChecks;
	};

	deleteChecks = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		if (!monitorId) {
			throw this.errorService.createBadRequestError("No monitor ID in request");
		}

		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		// For verificaiton, throws an error if monitor doesn't belong to team
		await this.monitorsRepository.findById(monitorId, teamId);

		const deletedCount = await this.db.checkModule.deleteChecks(monitorId);
		return deletedCount;
	};
	deleteChecksByTeamId = async ({ teamId }: { teamId: string }) => {
		if (!teamId) {
			throw this.errorService.createBadRequestError("No team ID in request");
		}

		const deletedCount = await this.db.checkModule.deleteChecksByTeamId(teamId);
		return deletedCount;
	};

	updateChecksTTL = async ({ teamId, ttl }: { teamId: string; ttl: string }) => {
		const SECONDS_PER_DAY = 86400;
		const newTTL = parseInt(ttl, 10) * SECONDS_PER_DAY;
		await this.db.checkModule.updateChecksTTL(teamId, newTTL);
	};
}

export default CheckService;
