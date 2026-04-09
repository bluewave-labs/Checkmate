import { useMemo } from "react";
import { monitorSchema, type MonitorFormData } from "@/Validation/monitor";
import type { Monitor, MonitorType } from "@/Types/Monitor";

interface UseMonitorFormOptions {
	data?: Monitor | null;
	defaultType?: MonitorType;
}

const normalizeNotifications = (notifications?: unknown[]) => {
	if (!Array.isArray(notifications)) {
		return [];
	}
	return notifications.map((notification) => {
		if (typeof notification === "string") {
			return { channelId: notification, delayMinutes: 0 };
		}
		const item = notification as {
			channelId?: unknown;
			delayMinutes?: unknown;
		};
		return {
			channelId: typeof item.channelId === "string" ? item.channelId : "",
			delayMinutes: typeof item.delayMinutes === "number" ? item.delayMinutes : 0,
		};
	});
};

const getBaseDefaults = (data?: Monitor | null) => ({
	name: data?.name || "",
	description: data?.description || "",
	interval: data?.interval || 60000,
	notifications: normalizeNotifications(data?.notifications),
	statusWindowSize: data?.statusWindowSize || 5,
	statusWindowThreshold: data?.statusWindowThreshold || 60,
	geoCheckEnabled: data?.geoCheckEnabled ?? false,
	geoCheckLocations: data?.geoCheckLocations || [],
	geoCheckInterval: data?.geoCheckInterval || 300000,
});

export const useMonitorForm = ({
	data = null,
	defaultType = "http",
}: UseMonitorFormOptions = {}) => {
	return useMemo(() => {
		const type = data?.type || defaultType;
		const base = getBaseDefaults(data);

		let defaults: MonitorFormData;

		switch (type) {
			case "http":
				defaults = {
					...base,
					type: "http",
					url: data?.url || "",
					ignoreTlsErrors: data?.ignoreTlsErrors || false,
					useAdvancedMatching: data?.useAdvancedMatching || false,
					matchMethod: data?.matchMethod || "",
					expectedValue: data?.expectedValue || "",
					jsonPath: data?.jsonPath || "",
				};
				break;
			case "ping":
				defaults = {
					...base,
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
			default:
				defaults = {
					...base,
					type: "http",
					url: "",
					ignoreTlsErrors: false,
					useAdvancedMatching: false,
					matchMethod: "",
					expectedValue: "",
					jsonPath: "",
				};
		}

		return { schema: monitorSchema, defaults };
	}, [data, defaultType]);
};
