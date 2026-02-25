import type { Monitor, GeoCheck } from "@/types/index.js";
import type { GeoCheckResult } from "@/types/geoCheck.js";
import { Types } from "mongoose";
import type { IGeoChecksRepository } from "@/repositories/index.js";
import type { IMonitorsRepository } from "@/repositories/index.js";
import type { IGlobalPingService } from "@/service/infrastructure/globalPingService.js";
import type { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "GeoChecksService";

export interface IGeoChecksService {
	readonly serviceName: string;
	buildGeoCheck(monitor: Monitor): Promise<GeoCheck | null>;
	createGeoChecks(geoChecks: GeoCheck[]): Promise<GeoCheck[]>;
	getGeoChecksByMonitor(args: { monitorId: string; query: any; teamId: string }): Promise<any>;
}

class GeoChecksService implements IGeoChecksService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private geoChecksRepository: IGeoChecksRepository;
	private globalPingService: IGlobalPingService;
	private monitorsRepository: IMonitorsRepository;

	constructor({
		logger,
		geoChecksRepository,
		globalPingService,
		monitorsRepository,
	}: {
		logger: ILogger;
		geoChecksRepository: IGeoChecksRepository;
		globalPingService: IGlobalPingService;
		monitorsRepository: IMonitorsRepository;
	}) {
		this.logger = logger;
		this.geoChecksRepository = geoChecksRepository;
		this.globalPingService = globalPingService;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return GeoChecksService.SERVICE_NAME;
	}

	async buildGeoCheck(monitor: Monitor): Promise<GeoCheck | null> {
		try {
			if (!monitor.url) {
				this.logger.warn({
					message: "Monitor missing URL for geo check",
					service: SERVICE_NAME,
					method: "buildGeoCheck",
					details: { monitorId: monitor.id },
				});
				return null;
			}

			if (!monitor.geoCheckLocations || monitor.geoCheckLocations.length === 0) {
				this.logger.warn({
					message: "Monitor missing geo check locations",
					service: SERVICE_NAME,
					method: "buildGeoCheck",
					details: { monitorId: monitor.id },
				});
				return null;
			}

			// Step 1: Create measurement request
			const measurementId = await this.globalPingService.createMeasurement(monitor.url, monitor.geoCheckLocations);

			if (!measurementId) {
				// GlobalPing API is down, skip this check
				this.logger.debug({
					message: "Skipping geo check due to API unavailability",
					service: SERVICE_NAME,
					method: "buildGeoCheck",
					details: { monitorId: monitor.id },
				});
				return null;
			}

			// Step 2: Poll for results
			const results = await this.globalPingService.pollForResults(measurementId);

			if (results.length === 0) {
				// No successful results (all locations timed out or failed)
				this.logger.debug({
					message: "No successful geo check results",
					service: SERVICE_NAME,
					method: "buildGeoCheck",
					details: { monitorId: monitor.id, measurementId },
				});
				return null;
			}

			// Step 3: Build GeoCheck document
			const geoCheck = this.createGeoCheckDocument(monitor, results);

			this.logger.debug({
				message: `Geo check completed for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "buildGeoCheck",
				details: { monitorId: monitor.id, resultsCount: results.length },
			});

			return geoCheck;
		} catch (error: any) {
			this.logger.error({
				message: "Error executing geo check",
				service: SERVICE_NAME,
				method: "buildGeoCheck",
				details: { monitorId: monitor.id, error: error.message },
				stack: error.stack,
			});
			return null;
		}
	}

	private createGeoCheckDocument(monitor: Monitor, results: GeoCheckResult[]): GeoCheck {
		const now = new Date();
		const ttl = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
		const expiryDate = new Date(now.getTime() + ttl);

		return {
			id: new Types.ObjectId().toString(),
			metadata: {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
			},
			results,
			expiry: expiryDate.toISOString(),
			__v: 0,
			createdAt: now.toISOString(),
			updatedAt: now.toISOString(),
		};
	}

	createGeoChecks = async (geoChecks: GeoCheck[]) => {
		return this.geoChecksRepository.createGeoChecks(geoChecks);
	};

	getGeoChecksByMonitor = async ({ monitorId, query, teamId }: { monitorId: string; query: any; teamId: string }) => {
		if (!monitorId) {
			throw new AppError({
				message: "No monitor ID in request",
				service: SERVICE_NAME,
				method: "getGeoChecksByMonitor",
				status: 400,
			});
		}
		if (!teamId) {
			throw new AppError({
				message: "No team ID in request",
				service: SERVICE_NAME,
				method: "getGeoChecksByMonitor",
				status: 400,
			});
		}

		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		if (!monitor) {
			throw new AppError({
				message: `Monitor with ID ${monitorId} not found.`,
				service: SERVICE_NAME,
				method: "getGeoChecksByMonitor",
				status: 404,
			});
		}

		let { sortOrder, dateRange, page, rowsPerPage, continent } = query;
		const continents = continent ? (Array.isArray(continent) ? continent : [continent]) : undefined;

		this.logger.debug({
			message: "getGeoChecksByMonitor query params",
			service: SERVICE_NAME,
			method: "getGeoChecksByMonitor",
			details: { continent, continents, query },
		});

		const parsedPage = page ? parseInt(page) : page;
		const parsedRowsPerPage = rowsPerPage ? parseInt(rowsPerPage) : rowsPerPage;

		const result = await this.geoChecksRepository.findByMonitorId(monitorId, sortOrder, dateRange, parsedPage, parsedRowsPerPage, continents);

		return result;
	};
}

export default GeoChecksService;
