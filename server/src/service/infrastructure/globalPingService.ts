import got, { type Got } from "got";
import type { ISettingsService } from "@/service/system/settingsService.js";
import { MonitorType } from "@/types/index.js";
import type { GeoCheckLocation, GeoCheckResult, GeoCheckTimings, GeoContinent } from "@/types/geoCheck.js";
import { supportsGeoCheck } from "@/types/monitor.js";
import type { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "GlobalPingService";
const GLOBAL_PING_API_BASE = "https://api.globalping.io/v1";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_TIMEOUT_MS = 30000;
const SETTINGS_STATUS_TIMEOUT_MS = 10000;

// Types
type GlobalpingCredentialState = "missing" | "valid" | "invalid" | "forbidden" | "upstream_unavailable";
type GlobalpingCreditState = "unknown" | "healthy" | "exhausted";
export type GlobalpingFailureClassification =
	| "missing_key"
	| "invalid_key"
	| "forbidden"
	| "rate_limited"
	| "unsupported_monitor"
	| "invalid_location"
	| "unknown";
export type GlobalpingRuntimeBehavior = "fail" | "retryable" | "fallback-allowed-only-without-key";

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

interface GlobalpingLimitsResponse {
	rateLimit?: {
		measurements?: {
			create?: {
				type?: "ip" | "user";
				limit?: number | null;
				remaining?: number | null;
				reset?: number | null;
			};
		};
	};
	credits?: {
		remaining?: number | null;
	};
	remainingCredits?: number | null;
	remainingLimit?: number | null;
	totalLimit?: number | null;
	resetAt?: string | null;
}

export interface GlobalpingStatus {
	keyConfigured: boolean;
	credentialState: GlobalpingCredentialState;
	creditState: GlobalpingCreditState;
	remainingCredits?: number | null;
	remainingLimit?: number | null;
	totalLimit?: number | null;
	resetAt?: string | null;
}

export interface GlobalpingFailureDetails {
	classification: GlobalpingFailureClassification;
	credentialState: GlobalpingCredentialState;
	message: string;
	runtimeBehavior: GlobalpingRuntimeBehavior;
	retryable: boolean;
}

export interface IGlobalPingService {
	readonly serviceName: string;
	createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null>;
	pollForResults(measurementId: string, timeoutMs?: number): Promise<GeoCheckResult[]>;
	getUsageStatus(): Promise<GlobalpingStatus>;
	classifyError(error: unknown): GlobalpingFailureDetails;
}

export class GlobalPingService implements IGlobalPingService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private logger: ILogger,
		private settingsService: ISettingsService,
		private httpClient: Got = got
	) {}

	get serviceName() {
		return GlobalPingService.SERVICE_NAME;
	}

	// Public API
	classifyError(error: unknown): GlobalpingFailureDetails {
		const statusCode = this.getStatusCode(error);

		if (statusCode === 401) {
			return {
				classification: "invalid_key",
				credentialState: "invalid",
				message: "The configured Globalping API key was rejected.",
				runtimeBehavior: "fail",
				retryable: false,
			};
		}

		if (statusCode === 403) {
			return {
				classification: "forbidden",
				credentialState: "forbidden",
				message: "The configured Globalping API key is not allowed to access this resource.",
				runtimeBehavior: "fail",
				retryable: false,
			};
		}

		if (statusCode === 429) {
			return {
				classification: "rate_limited",
				credentialState: "upstream_unavailable",
				message: "Globalping rate limit hit.",
				runtimeBehavior: "retryable",
				retryable: true,
			};
		}

		return {
			classification: "unknown",
			credentialState: "upstream_unavailable",
			message: "Globalping status is currently unavailable.",
			runtimeBehavior: "retryable",
			retryable: true,
		};
	}

	async getUsageStatus(): Promise<GlobalpingStatus> {
		const apiKey = await this.getApiKey();

		if (!apiKey) {
			return {
				keyConfigured: false,
				credentialState: "missing",
				creditState: "unknown",
			};
		}

		try {
			const response = await this.requestGlobalping<GlobalpingLimitsResponse>("get", "/limits", apiKey, {
				timeoutMs: SETTINGS_STATUS_TIMEOUT_MS,
			});
			const parsed = this.parseLimitsPayload(response.body);
			const creditState = this.deriveCreditState(parsed.remainingCredits);

			return {
				keyConfigured: true,
				credentialState: "valid",
				creditState,
				...parsed,
			};
		} catch (error) {
			const failure = this.classifyError(error);
			this.logFailure("getUsageStatus", error, failure);

			return {
				keyConfigured: true,
				credentialState: failure.credentialState,
				creditState: "unknown",
			};
		}
	}

	async createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null> {
		try {
			if (!supportsGeoCheck(monitorType)) {
				this.logger.warn({
					message: `Unsupported monitor type for Globalping: ${monitorType}`,
					service: SERVICE_NAME,
					method: "createMeasurement",
					details: { classification: "unsupported_monitor" satisfies GlobalpingFailureClassification },
				});
				return null;
			}

			if (!locations.length) {
				this.logger.warn({
					message: "No valid Globalping locations provided for measurement",
					service: SERVICE_NAME,
					method: "createMeasurement",
					details: { classification: "invalid_location" satisfies GlobalpingFailureClassification },
				});
				return null;
			}

			const apiKey = await this.getApiKey();
			const cleanTarget = url.replace(/^https?:\/\//, "");
			const requestBody: GlobalPingMeasurementRequest = {
				type: monitorType,
				target: cleanTarget,
				locations: locations.map((continent) => ({ continent })),
				limit: locations.length,
			};

			const response = await this.requestGlobalping<GlobalPingMeasurementResponse>("post", "/measurements", apiKey, {
				timeoutMs: 10000,
				json: requestBody,
			});

			const measurementId = response.body.id;
			this.logger.debug({
				message: `Created GlobalPing measurement: ${measurementId} for target: ${cleanTarget}`,
				service: SERVICE_NAME,
				method: "createMeasurement",
			});

			return measurementId;
		} catch (error) {
			const failure = this.classifyError(error);
			this.logFailure("createMeasurement", error, failure);

			if (failure.runtimeBehavior === "fail") {
				throw new AppError({
					message: failure.message,
					service: SERVICE_NAME,
					method: "createMeasurement",
					status: 502,
				});
			}

			return null;
		}
	}

	async pollForResults(measurementId: string, timeoutMs: number = MAX_POLL_TIMEOUT_MS): Promise<GeoCheckResult[]> {
		const startTime = Date.now();
		const apiKey = await this.getApiKey();

		while (Date.now() - startTime < timeoutMs) {
			try {
				const response = await this.requestGlobalping<GlobalPingMeasurementResponse>("get", `/measurements/${measurementId}`, apiKey, {
					timeoutMs: 5000,
				});
				const measurement = response.body;

				if (measurement.status === "finished") {
					const results = this.transformResults(measurement.results || []);
					if (measurement.results && results.length < measurement.results.length) {
						this.logger.warn({
							message: "Globalping returned partial or unsupported results",
							service: SERVICE_NAME,
							method: "pollForResults",
							details: {
								classification: "unknown" satisfies GlobalpingFailureClassification,
								measurementId,
								resultsCount: results.length,
								rawResultsCount: measurement.results.length,
							},
						});
					}
					return results;
				}

				if (measurement.status === "failed") {
					this.logger.warn({
						message: `Globalping measurement failed: ${measurementId}`,
						service: SERVICE_NAME,
						method: "pollForResults",
						details: { classification: "unknown" satisfies GlobalpingFailureClassification },
					});
					return [];
				}

				await this.sleep(POLL_INTERVAL_MS);
			} catch (error) {
				const failure = this.classifyError(error);
				this.logFailure("pollForResults", error, failure, { measurementId });
				if (failure.runtimeBehavior === "fail") {
					throw new AppError({
						message: failure.message,
						service: SERVICE_NAME,
						method: "pollForResults",
						status: 502,
					});
				}
				return [];
			}
		}

		this.logger.warn({
			message: `Globalping measurement polling timeout: ${measurementId}`,
			service: SERVICE_NAME,
			method: "pollForResults",
			details: { classification: "unknown" satisfies GlobalpingFailureClassification, measurementId, timeoutMs },
		});
		return [];
	}

	// Request helpers
	private async getApiKey() {
		const dbSettings = await this.settingsService.getDBSettings();
		return dbSettings.globalpingApiKey?.trim() || null;
	}

	private buildHeaders(apiKey: string | null) {
		if (!apiKey) {
			return undefined;
		}

		return {
			Authorization: `Bearer ${apiKey}`,
		};
	}

	private async requestGlobalping<T>(
		method: "get" | "post",
		path: string,
		apiKey: string | null,
		options: {
			timeoutMs: number;
			json?: unknown;
		}
	) {
		const url = `${GLOBAL_PING_API_BASE}${path}`;

		if (method === "get") {
			return this.httpClient.get<T>(url, {
				responseType: "json",
				timeout: { request: options.timeoutMs },
				headers: this.buildHeaders(apiKey),
			});
		}

		return this.httpClient.post<T>(url, {
			json: options.json,
			responseType: "json",
			timeout: { request: options.timeoutMs },
			headers: this.buildHeaders(apiKey),
		});
	}

	// Status helpers
	private getStatusCode(error: unknown) {
		if (typeof error !== "object" || error === null) {
			return undefined;
		}

		const maybeError = error as { response?: { statusCode?: number }; statusCode?: number };
		return maybeError.response?.statusCode ?? maybeError.statusCode;
	}

	private getErrorDetails(error: unknown) {
		if (!(error instanceof Error) && (typeof error !== "object" || error === null)) {
			return {
				message: "Unknown error",
			};
		}

		const maybeError = error as {
			name?: string;
			message?: string;
			code?: string;
			response?: { statusCode?: number; body?: unknown };
			options?: { url?: URL; method?: string };
		};

		return {
			name: maybeError.name ?? (error instanceof Error ? error.name : undefined),
			message: maybeError.message ?? (error instanceof Error ? error.message : "Unknown error"),
			code: maybeError.code,
			statusCode: maybeError.response?.statusCode,
			method: maybeError.options?.method,
			url: maybeError.options?.url?.toString(),
		};
	}

	private normalizeDate(value?: string | null) {
		if (!value) {
			return null;
		}

		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
	}

	private normalizeResetSeconds(value?: number | null) {
		if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
			return null;
		}

		return new Date(Date.now() + value * 1000).toISOString();
	}

	private toNullableNumber(value: unknown) {
		return typeof value === "number" && Number.isFinite(value) ? value : null;
	}

	private parseLimitsPayload(payload: GlobalpingLimitsResponse) {
		const createRateLimit = payload.rateLimit?.measurements?.create;
		const remainingCredits = this.toNullableNumber(payload.remainingCredits ?? payload.credits?.remaining);
		const remainingLimit = this.toNullableNumber(payload.remainingLimit ?? createRateLimit?.remaining);
		const totalLimit = this.toNullableNumber(payload.totalLimit ?? createRateLimit?.limit);
		const resetAt = this.normalizeDate(payload.resetAt) ?? this.normalizeResetSeconds(createRateLimit?.reset);

		if (remainingCredits === null && remainingLimit === null && totalLimit === null && resetAt === null) {
			throw new AppError({
				message: "Malformed Globalping limits response",
				service: SERVICE_NAME,
				method: "parseLimitsPayload",
				status: 502,
			});
		}

		return {
			remainingCredits,
			remainingLimit,
			totalLimit,
			resetAt,
		};
	}

	private deriveCreditState(remainingCredits: number | null): GlobalpingCreditState {
		if (remainingCredits === null) {
			return "unknown";
		}
		if (remainingCredits <= 0) {
			return "exhausted";
		}
		return "healthy";
	}

	private logFailure(method: string, error: unknown, failure: GlobalpingFailureDetails, extraDetails?: Record<string, unknown>) {
		this.logger.warn({
			message: failure.message,
			service: SERVICE_NAME,
			method,
			details: {
				classification: failure.classification,
				runtimeBehavior: failure.runtimeBehavior,
				...extraDetails,
				error: this.getErrorDetails(error),
			},
			stack: error instanceof Error ? error.stack : undefined,
		});
	}

	// Measurement helpers
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
				continue;
			}

			if (probeResult.result.stats) {
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
