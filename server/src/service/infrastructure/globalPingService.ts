import type { GeoContinent, GeoCheckResult, GeoCheckTimings, GeoCheckLocation } from "@/types/geoCheck.js";
import { supportsGeoCheck } from "@/types/monitor.js";
import { MonitorType } from "@/types/index.js";
import type { ILogger } from "@/utils/logger.js";
import type { ISettingsService } from "@/service/system/settingsService.js";
import got from "got";

const SERVICE_NAME = "GlobalPingService";
const GLOBAL_PING_API_BASE = "https://api.globalping.io/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_TIMEOUT_MS = 30000;

interface GlobalPingMeasurementRequest {
	type: MonitorType;
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
		stats?: {
			min: number;
			max: number;
			avg: number;
			total: number;
			loss: number;
			rcv: number;
			drop: number;
		};
		rawOutput?: string;
	};
}

export interface GlobalPingQuota {
	authenticated: boolean;
	remaining: number;
	limit: number;
}

export interface IGlobalPingService {
	readonly serviceName: string;
	createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null>;
	pollForResults(measurementId: string, timeoutMs?: number): Promise<GeoCheckResult[]>;
	getQuota(tokenOverride?: string): Promise<GlobalPingQuota>;
}

export class GlobalPingService implements IGlobalPingService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private settingsService: ISettingsService;

	constructor(logger: ILogger, settingsService: ISettingsService) {
		this.logger = logger;
		this.settingsService = settingsService;
	}

	get serviceName() {
		return GlobalPingService.SERVICE_NAME;
	}

	private async authHeaders(tokenOverride?: string): Promise<Record<string, string>> {
		const token = tokenOverride ?? (await this.settingsService.getGlobalpingApiToken());
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	async createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null> {
		try {
			if (!supportsGeoCheck(monitorType)) {
				throw new Error(`Unsupported monitor type for GlobalPing: ${monitorType}`);
			}
			const cleanTarget = url.replace(/^https?:\/\//, "");

			const requestBody: GlobalPingMeasurementRequest = {
				type: monitorType,
				target: cleanTarget,
				locations: locations.map((continent) => ({ continent })),
				limit: locations.length,
			};

			const headers = await this.authHeaders();

			const response = await got.post<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements`, {
				json: requestBody,
				headers,
				responseType: "json",
				timeout: { request: 10000 },
			});

			const measurementId = response.body.id;

			this.logger.debug({
				message: `Created GlobalPing measurement: ${measurementId} for target: ${cleanTarget}`,
				service: SERVICE_NAME,
				method: "createMeasurement",
			});

			return measurementId;
		} catch (error: unknown) {
			this.logger.error({
				message: "GlobalPing API unavailable, skipping geo check",
				service: SERVICE_NAME,
				method: "createMeasurement",
				details: { error: this.redactErrorMessage(error) },
			});
			return null;
		}
	}

	async pollForResults(measurementId: string, timeoutMs: number = MAX_POLL_TIMEOUT_MS): Promise<GeoCheckResult[]> {
		const startTime = Date.now();
		const headers = await this.authHeaders();

		while (Date.now() - startTime < timeoutMs) {
			try {
				const response = await got.get<GlobalPingMeasurementResponse>(`${GLOBAL_PING_API_BASE}/measurements/${measurementId}`, {
					headers,
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

				await this.sleep(POLL_INTERVAL_MS);
			} catch (error: unknown) {
				this.logger.error({
					message: "Error polling GlobalPing API",
					service: SERVICE_NAME,
					method: "pollForResults",
					details: { error: this.redactErrorMessage(error) },
				});
				return [];
			}
		}

		this.logger.warn({
			message: `GlobalPing measurement polling timeout: ${measurementId}`,
			service: SERVICE_NAME,
			method: "pollForResults",
			details: { measurementId, timeoutMs },
		});
		return [];
	}

	async getQuota(tokenOverride?: string): Promise<GlobalPingQuota> {
		const headers = await this.authHeaders(tokenOverride);
		const response = await got.get<{ rateLimit?: { measurements?: { create?: { limit?: number; remaining?: number } } } }>(
			`${GLOBAL_PING_API_BASE}/limits`,
			{
				headers,
				responseType: "json",
				timeout: { request: 5000 },
			}
		);

		const create = response.body.rateLimit?.measurements?.create;
		const limit = create?.limit ?? 0;
		const remaining = create?.remaining ?? 0;
		return {
			authenticated: Object.keys(headers).length > 0,
			limit,
			remaining,
		};
	}

	private redactErrorMessage(error: unknown): string {
		if (!(error instanceof Error)) return "Unknown error";
		return error.message.replace(/Bearer\s+[^\s"']+/gi, "Bearer ***REDACTED***");
	}

	private transformResults(probeResults: GlobalPingProbeResult[]): GeoCheckResult[] {
		const successfulResults: GeoCheckResult[] = [];

		for (const probeResult of probeResults) {
			if (probeResult.result.status !== "finished") {
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

			// HTTP results have statusCode and timings, ping results have stats
			if (probeResult.result.statusCode && probeResult.result.timings) {
				const timings: GeoCheckTimings = {
					total: probeResult.result.timings.total,
					dns: probeResult.result.timings.dns,
					tcp: probeResult.result.timings.tcp,
					tls: probeResult.result.timings.tls,
					firstByte: probeResult.result.timings.firstByte,
					download: probeResult.result.timings.download,
				};

				successfulResults.push({
					location,
					status: probeResult.result.statusCode >= 200 && probeResult.result.statusCode < 300,
					statusCode: probeResult.result.statusCode,
					timings,
				});
			} else if (probeResult.result.stats) {
				successfulResults.push({
					location,
					status: probeResult.result.stats.loss === 0,
					statusCode: probeResult.result.stats.loss === 0 ? 200 : 5000,
					timings: {
						total: probeResult.result.stats.avg,
						dns: 0,
						tcp: 0,
						tls: 0,
						firstByte: 0,
						download: 0,
					},
				});
			}
		}

		return successfulResults;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
