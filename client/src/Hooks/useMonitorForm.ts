import { useMemo } from "react";
import { monitorSchema, type MonitorFormData } from "@/Validation/monitor";
import { DefaultHttpMethod, DefaultPageSpeedStrategy } from "@/Types/Monitor";
import type { Monitor, MonitorType } from "@/Types/Monitor";

interface UseMonitorFormOptions {
	data?: Monitor | null;
	defaultType?: MonitorType;
}

const getBaseDefaults = (data?: Monitor | null) => ({
	name: data?.name || "",
	description: data?.description || "",
	interval: data?.interval || 60000,
	notifications: data?.notifications || [],
	tags: data?.tags || [],
	statusWindowSize: data?.statusWindowSize || 5,
	statusWindowThreshold: data?.statusWindowThreshold || 60,
});

// Geo-check defaults — only http and ping support geo checks.
const getGeoCheckDefaults = (data?: Monitor | null) => ({
	geoCheckEnabled: data?.geoCheckEnabled ?? false,
	geoCheckLocations: data?.geoCheckLocations || [],
	geoCheckInterval: data?.geoCheckInterval || 300000,
});

export const getMonitorDefaults = (
	type: MonitorType,
	data: Monitor | null = null
): MonitorFormData => {
	const base = getBaseDefaults(data);

	let defaults: MonitorFormData;

	switch (type) {
		case "http":
			defaults = {
				...base,
				...getGeoCheckDefaults(data),
				type: "http",
				url: data?.url || "",
				method: data?.method ?? DefaultHttpMethod,
				ignoreTlsErrors: data?.ignoreTlsErrors || false,
				useAdvancedMatching: data?.useAdvancedMatching || false,
				matchMethod: data?.matchMethod || "",
				expectedValue: data?.expectedValue || "",
				jsonPath: data?.jsonPath || "",
				customUpCodes: data?.customUpCodes || [],
			};
			break;
		case "ping":
			defaults = {
				...base,
				...getGeoCheckDefaults(data),
				type: "ping",
				url: data?.url || "",
			};
			break;
		case "port":
			defaults = {
				...base,
				type: "port",
				url: data?.url || "",
				port: data?.port || 80,
			};
			break;
		case "docker":
			defaults = {
				...base,
				type: "docker",
				url: data?.url || "",
			};
			break;
		case "game":
			defaults = {
				...base,
				type: "game",
				url: data?.url || "",
				port: data?.port || 27015,
				gameId: data?.gameId || "",
			};
			break;
		case "grpc":
			defaults = {
				...base,
				type: "grpc",
				url: data?.url || "",
				port: data?.port || 50051,
				grpcServiceName: data?.grpcServiceName || "",
				ignoreTlsErrors: data?.ignoreTlsErrors || false,
			};
			break;
		case "pagespeed":
			defaults = {
				...base,
				type: "pagespeed",
				url: data?.url || "",
				strategy: data?.strategy ?? DefaultPageSpeedStrategy,
			};
			break;
		case "hardware":
			defaults = {
				...base,
				type: "hardware",
				url: data?.url || "",
				secret: data?.secret || "",
				cpuAlertThreshold: data?.cpuAlertThreshold ?? 100,
				memoryAlertThreshold: data?.memoryAlertThreshold ?? 100,
				diskAlertThreshold: data?.diskAlertThreshold ?? 100,
				tempAlertThreshold: data?.tempAlertThreshold ?? 100,
				selectedDisks: data?.selectedDisks || [],
			};
			break;
		case "websocket":
			defaults = {
				...base,
				type: "websocket",
				url: data?.url || "",
				ignoreTlsErrors: data?.ignoreTlsErrors || false,
			};
			break;
		case "dns":
			defaults = {
				...base,
				type: "dns",
				url: data?.url || "",
				dnsServer: data?.dnsServer || "",
				dnsRecordType: data?.dnsRecordType || "A",
			};
			break;
		case "script":
			defaults = {
				...base,
				type: "script",
				url: data?.url || "",
				secret: data?.secret || "",
				scriptId: data?.scriptId || "",
				scriptExecutionTarget: data?.scriptExecutionTarget || "capture",
				probeId: data?.probeId || "",
				scriptExitCodeSuccess: data?.scriptExitCodeSuccess ?? 0,
				scriptOutputMatchRegex: data?.scriptOutputMatchRegex || "",
				scriptMaxExecutionTimeMs: data?.scriptMaxExecutionTimeMs ?? 30000,
				scriptParameterOverrides: data?.scriptParameterOverrides || {},
			};
			break;
		default:
			defaults = {
				...base,
				...getGeoCheckDefaults(data),
				type: "http",
				url: "",
				method: DefaultHttpMethod,
				ignoreTlsErrors: false,
				useAdvancedMatching: false,
				matchMethod: "",
				expectedValue: "",
				jsonPath: "",
				customUpCodes: [],
			};
	}

	return defaults;
};

export const useMonitorForm = ({
	data = null,
	defaultType = "http",
}: UseMonitorFormOptions = {}) => {
	return useMemo(() => {
		const type = data?.type || defaultType;
		return { schema: monitorSchema, defaults: getMonitorDefaults(type, data) };
	}, [data, defaultType]);
};
