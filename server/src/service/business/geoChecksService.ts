import type { Monitor, GeoCheck } from "@/types/index.js";
import { Types } from "mongoose";
import type { IGeoChecksRepository } from "@/repositories/index.js";
import type { IGlobalPingService } from "@/service/infrastructure/globalPingService.js";
import type { IBufferService } from "@/service/infrastructure/bufferService.js";

const SERVICE_NAME = "GeoChecksService";

export interface IGeoChecksService {
	readonly serviceName: string;
	executeGeoCheck(monitor: Monitor): Promise<void>;
}

class GeoChecksService implements IGeoChecksService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private geoChecksRepository: IGeoChecksRepository;
	private globalPingService: IGlobalPingService;
	private bufferService: IBufferService;
	private TTL_DAYS: number;

	constructor({
		logger,
		geoChecksRepository,
		globalPingService,
		bufferService,
		settingsService,
	}: {
		logger: any;
		geoChecksRepository: IGeoChecksRepository;
		globalPingService: IGlobalPingService;
		bufferService: IBufferService;
		settingsService: any;
	}) {
		this.logger = logger;
		this.geoChecksRepository = geoChecksRepository;
		this.globalPingService = globalPingService;
		this.bufferService = bufferService;
		this.TTL_DAYS = settingsService.getSettings().checksTTL || 90;
	}

	get serviceName() {
		return GeoChecksService.SERVICE_NAME;
	}

	/**
	 * Execute a geo-distributed check for a monitor
	 * 1. Create measurement request with GlobalPing API
	 * 2. Poll for results (with 30s timeout)
	 * 3. Transform and save results to buffer
	 */
	async executeGeoCheck(monitor: Monitor): Promise<void> {
		try {
			if (!monitor.url) {
				this.logger.warn({
					message: "Monitor missing URL for geo check",
					service: SERVICE_NAME,
					method: "executeGeoCheck",
					details: { monitorId: monitor.id },
				});
				return;
			}

			if (!monitor.geoCheckLocations || monitor.geoCheckLocations.length === 0) {
				this.logger.warn({
					message: "Monitor missing geo check locations",
					service: SERVICE_NAME,
					method: "executeGeoCheck",
					details: { monitorId: monitor.id },
				});
				return;
			}

			// Step 1: Create measurement request
			const measurementId = await this.globalPingService.createMeasurement(monitor.url, monitor.geoCheckLocations);

			if (!measurementId) {
				// GlobalPing API is down, skip this check
				this.logger.debug({
					message: "Skipping geo check due to API unavailability",
					service: SERVICE_NAME,
					method: "executeGeoCheck",
					details: { monitorId: monitor.id },
				});
				return;
			}

			// Step 2: Poll for results
			const results = await this.globalPingService.pollForResults(measurementId);

			if (results.length === 0) {
				// No successful results (all locations timed out or failed)
				this.logger.debug({
					message: "No successful geo check results",
					service: SERVICE_NAME,
					method: "executeGeoCheck",
					details: { monitorId: monitor.id, measurementId },
				});
				return;
			}

			// Step 3: Build GeoCheck document
			const geoCheck = this.buildGeoCheck(monitor, results);

			// Step 4: Add to buffer for batched insertion
			this.bufferService.addGeoCheckToBuffer(geoCheck);

			this.logger.debug({
				message: `Geo check completed for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "executeGeoCheck",
				details: { monitorId: monitor.id, resultsCount: results.length },
			});
		} catch (error: any) {
			this.logger.error({
				message: "Error executing geo check",
				service: SERVICE_NAME,
				method: "executeGeoCheck",
				details: { monitorId: monitor.id, error: error.message },
				stack: error.stack,
			});
		}
	}

	private buildGeoCheck(monitor: Monitor, results: any[]): GeoCheck {
		const now = new Date();
		const expiryDate = new Date(now.getTime() + this.TTL_DAYS * 24 * 60 * 60 * 1000);

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

	/**
	 * Create geo checks (called by buffer service)
	 */
	createGeoChecks = async (geoChecks: GeoCheck[]) => {
		return this.geoChecksRepository.create(geoChecks);
	};
}

export default GeoChecksService;
