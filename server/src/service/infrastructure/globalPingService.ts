import type { GeoContinent, GeoCheckResult, GeoCheckTimings, GeoCheckLocation } from "@/types/geoCheck.js";
import got from "got";

const SERVICE_NAME = "GlobalPingService";
const GLOBAL_PING_API_BASE = "https://api.globalping.io/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_TIMEOUT_MS = 30000;

interface GlobalPingMeasurementRequest {
	type: "http";
	target: string;
	locations: Array<{ continent: GeoContinent }>;
	limit: number;
}

interface GlobalPingMeasurementResponse {
	id: string;
	type: string;
	status: "in-progress" | "finished" | "failed";
	probesCount: number;
	results?: GlobalPingProbeResult[];
}

interface GlobalPingProbeResult {
	probe: {
		continent: GeoContinent;
		region: string;
		country: string;
		state: string | null;
		city: string;
		longitude: number;
		latitude: number;
	};
	result: {
		status: "finished" | "failed" | "timeout";
		statusCode?: number;
		statusCodeName?: string;
		timings?: {
			total: number;
			dns: number;
			tcp: number;
			tls: number;
			firstByte: number;
			download: number;
		};
		rawOutput?: string;
	};
}

export interface IGlobalPingService {
	readonly serviceName: string;
	createMeasurement(url: string, locations: GeoContinent[]): Promise<string | null>;
	pollForResults(measurementId: string, timeoutMs?: number): Promise<GeoCheckResult[]>;
}

class GlobalPingService implements IGlobalPingService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;

	constructor({ logger }: { logger: any }) {
		this.logger = logger;
	}

	get serviceName() {
		return GlobalPingService.SERVICE_NAME;
	}

	async createMeasurement(url: string, locations: GeoContinent[]): Promise<string | null> {
		try {
			const requestBody: GlobalPingMeasurementRequest = {
				type: "http",
				target: url,
				locations: locations.map((continent) => ({ continent })),
				limit: locations.length,
			};

			const response = await got.post<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements`, {
				json: requestBody,
				responseType: "json",
				timeout: { request: 10000 },
			});

			const measurementId = response.body.id;

			this.logger.debug({
				message: `Created GlobalPing measurement: ${measurementId}`,
				service: SERVICE_NAME,
				method: "createMeasurement",
				details: { measurementId, url, locations },
			});

			return measurementId;
		} catch (error: any) {
			this.logger.error({
				message: "GlobalPing API unavailable, skipping geo check",
				service: SERVICE_NAME,
				method: "createMeasurement",
				details: error.message,
			});
			return null;
		}
	}

	async pollForResults(measurementId: string, timeoutMs: number = MAX_POLL_TIMEOUT_MS): Promise<GeoCheckResult[]> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeoutMs) {
			try {
				const response = await got.get<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements/${measurementId}`, {
					responseType: "json",
					timeout: { request: 5000 },
				});

				const measurement = response.body;

				if (measurement.status === "finished") {
					const results = this.transformResults(measurement.results || []);
					this.logger.debug({
						message: `GlobalPing measurement completed: ${measurementId}`,
						service: SERVICE_NAME,
						method: "pollForResults",
						details: { measurementId, resultsCount: results.length },
					});
					return results;
				}

				if (measurement.status === "failed") {
					this.logger.warn({
						message: `GlobalPing measurement failed: ${measurementId}`,
						service: SERVICE_NAME,
						method: "pollForResults",
					});
					return [];
				}

				// Still in-progress, wait and poll again
				await this.sleep(POLL_INTERVAL_MS);
			} catch (error: any) {
				this.logger.error({
					message: "Error polling GlobalPing API",
					service: SERVICE_NAME,
					method: "pollForResults",
					details: error.message,
				});
				return [];
			}
		}

		// Timeout reached
		this.logger.warn({
			message: `GlobalPing measurement polling timeout: ${measurementId}`,
			service: SERVICE_NAME,
			method: "pollForResults",
			details: { measurementId, timeoutMs },
		});
		return [];
	}

	private transformResults(probeResults: GlobalPingProbeResult[]): GeoCheckResult[] {
		const successfulResults: GeoCheckResult[] = [];

		for (const probeResult of probeResults) {
			// Skip failed or timeout results
			if (probeResult.result.status !== "finished" || !probeResult.result.statusCode || !probeResult.result.timings) {
				continue;
			}

			const location: GeoCheckLocation = {
				continent: probeResult.probe.continent,
				region: probeResult.probe.region,
				country: probeResult.probe.country,
				state: probeResult.probe.state || "",
				city: probeResult.probe.city,
				longitude: probeResult.probe.longitude,
				latitude: probeResult.probe.latitude,
			};

			const timings: GeoCheckTimings = {
				total: probeResult.result.timings.total,
				dns: probeResult.result.timings.dns,
				tcp: probeResult.result.timings.tcp,
				tls: probeResult.result.timings.tls,
				firstByte: probeResult.result.timings.firstByte,
				download: probeResult.result.timings.download,
			};

			const result: GeoCheckResult = {
				location,
				status: probeResult.result.statusCode >= 200 && probeResult.result.statusCode < 300,
				statusCode: probeResult.result.statusCode,
				timings,
			};

			successfulResults.push(result);
		}

		return successfulResults;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default GlobalPingService;
