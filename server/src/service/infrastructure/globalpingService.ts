import { Globalping } from "globalping";
import type { ISettingsService } from "@/service/system/settingsService.js";
import type { Monitor } from "@/types/monitor.js";
import type { MonitorStatusResponse } from "@/types/network.js";

const SERVICE_NAME = "GlobalpingService";

const LOCATION_MAP: Record<string, { continent: string }> = {
	"north-america": { continent: "NA" },
	europe: { continent: "EU" },
	asia: { continent: "AS" },
	"south-america": { continent: "SA" },
	oceania: { continent: "OC" },
	africa: { continent: "AF" },
};

export const GLOBALPING_LOCATIONS = [
	{ id: "north-america", label: "North America" },
	{ id: "europe", label: "Europe" },
	{ id: "asia", label: "Asia" },
	{ id: "south-america", label: "South America" },
	{ id: "oceania", label: "Oceania" },
	{ id: "africa", label: "Africa" },
];

class GlobalpingService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private settingsService: ISettingsService;
	private client: Globalping<false> | null = null;
	private lastApiKey: string | undefined;

	constructor({ settingsService, logger }: { settingsService: ISettingsService; logger: any }) {
		this.settingsService = settingsService;
		this.logger = logger;
	}

	get serviceName() {
		return GlobalpingService.SERVICE_NAME;
	}

	private async getClient(): Promise<Globalping<false> | null> {
		const dbSettings = await this.settingsService.getDBSettings();
		const apiKey = dbSettings.globalpingApiKey;

		if (!apiKey) {
			return null;
		}

		if (this.client && this.lastApiKey === apiKey) {
			return this.client;
		}

		this.client = new Globalping({ auth: apiKey, throwApiErrors: false, timeout: 30000 });
		this.lastApiKey = apiKey;
		return this.client;
	}

	async runChecks(monitor: Monitor): Promise<MonitorStatusResponse[]> {
		if (!monitor.locations || monitor.locations.length === 0) {
			return [];
		}

		const client = await this.getClient();
		if (!client) {
			this.logger.warn({
				message: "Globalping API key not configured, skipping location checks",
				service: SERVICE_NAME,
				method: "runChecks",
			});
			return [];
		}

		const measurementType = monitor.type === "ping" ? "ping" : "http";
		const monitorUrl = monitor.url ?? "";

		// Parse target from monitor URL
		let target: string;
		try {
			if (measurementType === "http") {
				const url = new URL(monitorUrl);
				target = url.hostname;
			} else {
				target = monitorUrl.replace(/^https?:\/\//, "").split("/")[0] ?? monitorUrl;
			}
		} catch {
			target = monitorUrl;
		}

		const locations = monitor.locations
			.map((loc) => LOCATION_MAP[loc])
			.filter(Boolean);

		if (locations.length === 0) {
			return [];
		}

		try {
			const createResult = measurementType === "http"
				? await client.createMeasurement({
						type: "http" as const,
						target,
						locations: locations as any,
						measurementOptions: { request: { method: "HEAD" }, protocol: "HTTPS" },
					})
				: await client.createMeasurement({
						type: "ping" as const,
						target,
						locations: locations as any,
					});

			if (!createResult.ok) {
				this.logger.warn({
					message: "Failed to create Globalping measurement",
					service: SERVICE_NAME,
					method: "runChecks",
					details: JSON.stringify(createResult.data),
				});
				return [];
			}

			const measurementId = (createResult.data as any).id;
			const awaitResult = await client.awaitMeasurement(measurementId);

			if (!awaitResult.ok) {
				this.logger.warn({
					message: "Failed to await Globalping measurement",
					service: SERVICE_NAME,
					method: "runChecks",
					details: JSON.stringify(awaitResult.data),
				});
				return [];
			}

			const measurement = awaitResult.data as any;
			const results: MonitorStatusResponse[] = [];

			for (const item of measurement.results || []) {
				const probe = item.probe;
				const result = item.result;
				const locationLabel = this.getLocationLabel(probe?.continent, probe?.country);

				if (measurementType === "http") {
					results.push({
						monitorId: monitor.id,
						teamId: monitor.teamId,
						type: monitor.type,
						status: result.statusCode >= 200 && result.statusCode < 400,
						code: result.statusCode || 0,
						message: result.statusCodeName || result.rawOutput || "",
						responseTime: result.timings?.total ?? 0,
						location: locationLabel,
					});
				} else {
					// Ping
					const stats = result.stats;
					results.push({
						monitorId: monitor.id,
						teamId: monitor.teamId,
						type: monitor.type,
						status: stats?.loss !== undefined ? stats.loss < 100 : false,
						code: stats?.loss === 0 ? 200 : 5000,
						message: stats?.loss === 0 ? "Ping successful" : `Packet loss: ${stats?.loss}%`,
						responseTime: stats?.avg ?? 0,
						location: locationLabel,
					});
				}
			}

			return results;
		} catch (error: any) {
			this.logger.warn({
				message: `Globalping check failed: ${error.message}`,
				service: SERVICE_NAME,
				method: "runChecks",
				stack: error.stack,
			});
			return [];
		}
	}

	private getLocationLabel(continent?: string, country?: string): string {
		if (continent && country) {
			return `${continent}-${country}`;
		}
		return continent || country || "unknown";
	}

	async getLimits(): Promise<any | null> {
		const client = await this.getClient();
		if (!client) {
			return null;
		}

		try {
			const result = await client.getLimits();
			if (result.ok) {
				return result.data;
			}
			return null;
		} catch {
			return null;
		}
	}
}

export default GlobalpingService;
