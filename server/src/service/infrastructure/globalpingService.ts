import { Globalping } from "globalping";
import type { ISettingsService } from "@/service/system/settingsService.js";
import type { Monitor } from "@/types/monitor.js";
import type { MonitorStatusResponse } from "@/types/network.js";

const SERVICE_NAME = "GlobalpingService";

interface GlobalpingLocationOption {
	id: string;
	label: string;
}

// Maps location IDs to Globalping API location objects
const LOCATION_MAP: Record<string, Record<string, string>> = {
	"north-america": { continent: "NA" },
	europe: { continent: "EU" },
	asia: { continent: "AS" },
	"south-america": { continent: "SA" },
	oceania: { continent: "OC" },
	africa: { continent: "AF" },
	"us-east": { country: "US", state: "VA" },
	"us-west": { country: "US", state: "CA" },
	canada: { country: "CA", city: "Toronto" },
	uk: { country: "GB", city: "London" },
	germany: { country: "DE", city: "Frankfurt" },
	netherlands: { country: "NL", city: "Amsterdam" },
	poland: { country: "PL", city: "Warsaw" },
	japan: { country: "JP", city: "Tokyo" },
	singapore: { country: "SG", city: "Singapore" },
	india: { country: "IN", city: "Mumbai" },
	australia: { country: "AU", city: "Sydney" },
	brazil: { country: "BR" },
	chile: { country: "CL", city: "Santiago" },
	"south-africa": { country: "ZA", city: "Johannesburg" },
	uae: { country: "AE", city: "Dubai" },
};

const LOCATIONS_TIER_3: GlobalpingLocationOption[] = [
	{ id: "north-america", label: "North America" },
	{ id: "europe", label: "Europe" },
	{ id: "asia", label: "Asia" },
];

const LOCATIONS_TIER_6: GlobalpingLocationOption[] = [
	...LOCATIONS_TIER_3,
	{ id: "south-america", label: "South America" },
	{ id: "oceania", label: "Oceania" },
	{ id: "africa", label: "Africa" },
];

const LOCATIONS_TIER_15: GlobalpingLocationOption[] = [
	{ id: "us-east", label: "US East (Virginia)" },
	{ id: "us-west", label: "US West (California)" },
	{ id: "canada", label: "Canada (Toronto)" },
	{ id: "uk", label: "UK (London)" },
	{ id: "germany", label: "Germany (Frankfurt)" },
	{ id: "netherlands", label: "Netherlands (Amsterdam)" },
	{ id: "poland", label: "Poland (Warsaw)" },
	{ id: "japan", label: "Japan (Tokyo)" },
	{ id: "singapore", label: "Singapore" },
	{ id: "india", label: "India (Mumbai)" },
	{ id: "australia", label: "Australia (Sydney)" },
	{ id: "brazil", label: "Brazil" },
	{ id: "chile", label: "Chile (Santiago)" },
	{ id: "south-africa", label: "South Africa (Johannesburg)" },
	{ id: "uae", label: "UAE (Dubai)" },
];

const LOCATIONS_BY_TIER: Record<number, GlobalpingLocationOption[]> = {
	3: LOCATIONS_TIER_3,
	6: LOCATIONS_TIER_6,
	15: LOCATIONS_TIER_15,
};

// Build a lookup from location ID to human-readable label
const LOCATION_LABELS: Record<string, string> = {};
for (const tier of Object.values(LOCATIONS_BY_TIER)) {
	for (const loc of tier) {
		LOCATION_LABELS[loc.id] = loc.label;
	}
}

export const getGlobalpingLocationsByTier = (tier: number): GlobalpingLocationOption[] => {
	return LOCATIONS_BY_TIER[tier] ?? LOCATIONS_TIER_6;
};

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

	/**
	 * Gets the current tier's location IDs from settings.
	 * This is the source of truth for which locations to check.
	 */
	private async getTierLocationIds(): Promise<string[]> {
		const dbSettings = await this.settingsService.getDBSettings();
		const tier = dbSettings.globalpingLocationsTier ?? 6;
		return getGlobalpingLocationsByTier(tier).map((loc) => loc.id);
	}

	async runChecks(monitor: Monitor): Promise<MonitorStatusResponse[]> {
		if (monitor.type !== "http" && monitor.type !== "ping") {
			return [];
		}

		const client = await this.getClient();
		if (!client) {
			return [];
		}

		const locationIds = await this.getTierLocationIds();
		if (locationIds.length === 0) {
			return [];
		}

		const measurementType = monitor.type === "ping" ? "ping" : "http";
		const monitorUrl = monitor.url ?? "";

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

		const locations = locationIds
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
				const locationId = this.resolveLocationId(probe?.continent, probe?.country, locationIds);

				if (measurementType === "http") {
					results.push({
						monitorId: monitor.id,
						teamId: monitor.teamId,
						type: monitor.type,
						status: result.statusCode >= 200 && result.statusCode < 400,
						code: result.statusCode || 0,
						message: result.statusCodeName || result.rawOutput || "",
						responseTime: result.timings?.total ?? 0,
						location: locationId,
					});
				} else {
					const stats = result.stats;
					results.push({
						monitorId: monitor.id,
						teamId: monitor.teamId,
						type: monitor.type,
						status: stats?.loss !== undefined ? stats.loss < 100 : false,
						code: stats?.loss === 0 ? 200 : 5000,
						message: stats?.loss === 0 ? "Ping successful" : `Packet loss: ${stats?.loss}%`,
						responseTime: stats?.avg ?? 0,
						location: locationId,
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

	/**
	 * Maps a probe's continent/country back to a configured location ID.
	 * For city-level tiers, matches by country code.
	 * For continent-level tiers, matches by continent code.
	 */
	private resolveLocationId(continent?: string, country?: string, configuredIds?: string[]): string {
		if (!configuredIds || configuredIds.length === 0) {
			return continent && country ? `${continent}-${country}` : continent || country || "unknown";
		}

		// Try country-level match first (for tier 15)
		if (country) {
			for (const id of configuredIds) {
				const loc = LOCATION_MAP[id];
				if (loc?.country === country) {
					return id;
				}
			}
		}

		// Fall back to continent-level match (for tier 3/6)
		if (continent) {
			for (const id of configuredIds) {
				const loc = LOCATION_MAP[id];
				if (loc?.continent === continent) {
					return id;
				}
			}
		}

		return continent && country ? `${continent}-${country}` : continent || country || "unknown";
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

export { LOCATION_LABELS };
export default GlobalpingService;
