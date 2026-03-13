import type { GeoCheckResult, GeoContinent } from "@/types/geoCheck.js";
import type { MonitorType } from "@/types/monitor.js";

export const GlobalpingCredentialStates = [
	"missing",
	"valid",
	"invalid",
	"forbidden",
	"upstream_unavailable",
] as const;

export type GlobalpingCredentialState = (typeof GlobalpingCredentialStates)[number];

export const GlobalpingCreditStates = ["unknown", "healthy", "exhausted"] as const;

export type GlobalpingCreditState = (typeof GlobalpingCreditStates)[number];

export const GlobalpingFailureClassifications = [
	"missing_key",
	"invalid_key",
	"forbidden",
	"rate_limited",
	"unsupported_monitor",
	"invalid_location",
	"unknown",
] as const;

export type GlobalpingFailureClassification = (typeof GlobalpingFailureClassifications)[number];

export const GlobalpingRuntimeBehaviors = ["fail", "retryable"] as const;

export type GlobalpingRuntimeBehavior = (typeof GlobalpingRuntimeBehaviors)[number];

export interface GlobalpingStatus {
	credentialState: GlobalpingCredentialState;
	creditState: GlobalpingCreditState;
	remainingCredits?: number | null;
	remainingLimit?: number | null;
}

export interface GlobalpingFailureDetails {
	classification: GlobalpingFailureClassification;
	credentialState: GlobalpingCredentialState;
	message: string;
	runtimeBehavior: GlobalpingRuntimeBehavior;
}

export interface IGlobalPingService {
	readonly serviceName: string;
	createMeasurement(monitorType: MonitorType, url: string, locations: GeoContinent[]): Promise<string | null>;
	pollForResults(measurementId: string, timeoutMs?: number): Promise<GeoCheckResult[]>;
	getUsageStatus(): Promise<GlobalpingStatus>;
	classifyError(error: unknown): GlobalpingFailureDetails;
}
