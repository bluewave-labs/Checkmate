import { Globalping } from "globalping";
import type { ISettingsService } from "@/service/system/settingsService.js";
import type { Monitor } from "@/types/monitor.js";
import type { GlobalpingCheckResult } from "@/types/network.js";

const SERVICE_NAME = "GlobalpingService";

export interface GlobalpingLocationOption {
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

const HOSTNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

export const getGlobalpingLocationsByTier = (tier: number): GlobalpingLocationOption[] => {
	return LOCATIONS_BY_TIER[tier] ?? LOCATIONS_TIER_6;
};

class GlobalpingService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: any;
	private settingsService: ISettingsService;
	private client: Globalping<false> | null = null;
	private lastApiKey: string | undefined;
	private inFlightChecks = new Set<string>();

	constructor({ settingsService, logger }: { settingsService: ISettingsService; logger: any }) {
		this.settingsService = settingsService;
		this.logger = logger;
	}

	get serviceName() {
		return GlobalpingService.SERVICE_NAME;
	}

	/**
	 * Reads settings once, returns both the SDK client and configured location IDs.
	 * Returns null client if the API key is not configured.
	 */
	private async getClientAndLocations(): Promise<{
		client: Globalping<false> | null;
		locationIds: string[];
	}> {
		const dbSettings = await this.settingsService.getDBSettings();
		const apiKey = dbSettings.globalpingApiKey;

		if (!apiKey) {
			return { client: null, locationIds: [] };
		}

		if (!this.client || this.lastApiKey !== apiKey) {
			this.client = new Globalping({ auth: apiKey, throwApiErrors: false, timeout: 30000 });
			this.lastApiKey = apiKey;
		}

		const tier = dbSettings.globalpingLocationsTier ?? 6;
		const locationIds = getGlobalpingLocationsByTier(tier).map((loc) => loc.id);

		return { client: this.client, locationIds };
	}

	async runChecks(monitor: Monitor): Promise<GlobalpingCheckResult[]> {
		if (monitor.type !== "http" && monitor.type !== "ping") {
			return [];
		}

		// Prevent overlapping checks for the same monitor
		if (this.inFlightChecks.has(monitor.id)) {
			return [];
		}

		this.inFlightChecks.add(monitor.id);
		try {
			return await this.executeChecks(monitor);
		} finally {
			this.inFlightChecks.delete(monitor.id);
		}
	}

	private async executeChecks(monitor: Monitor): Promise<GlobalpingCheckResult[]> {
		const { client, locationIds } = await this.getClientAndLocations();
		if (!client || locationIds.length === 0) {
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

		if (!target || !HOSTNAME_REGEX.test(target)) {
			this.logger.warn({
				message: `Invalid target hostname for Globalping: "${target}"`,
				service: SERVICE_NAME,
				method: "executeChecks",
				monitorId: monitor.id,
			});
			return [];
		}

		const locations = locationIds.map((loc) => LOCATION_MAP[loc]).filter(Boolean);

		if (locations.length === 0) {
			return [];
		}

		try {
			const createResult =
				measurementType === "http"
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
					method: "executeChecks",
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
					method: "executeChecks",
					details: JSON.stringify(awaitResult.data),
				});
				return [];
			}

			const measurement = awaitResult.data as any;
			const results: GlobalpingCheckResult[] = [];

			for (const item of measurement.results || []) {
				const probe = item.probe;
				const result = item.result;
				const locationId = this.resolveLocationId(probe?.continent, probe?.country, locationIds);

				if (measurementType === "http") {
					results.push({
						location: locationId,
						status: result.statusCode >= 200 && result.statusCode < 400,
						statusCode: result.statusCode || 0,
						message: result.statusCodeName || result.rawOutput || "",
						responseTime: result.timings?.total ?? 0,
					});
				} else {
					// Ping: loss < 100% is considered up (consistent with local ping checks)
					const stats = result.stats;
					results.push({
						location: locationId,
						status: stats?.loss !== undefined ? stats.loss < 100 : false,
						statusCode: stats?.loss === 0 ? 200 : 5000,
						message: stats?.loss === 0 ? "Ping successful" : `Packet loss: ${stats?.loss}%`,
						responseTime: stats?.avg ?? 0,
					});
				}
			}

			return results;
		} catch (error: any) {
			this.logger.warn({
				message: `Globalping check failed: ${error.message}`,
				service: SERVICE_NAME,
				method: "executeChecks",
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
}

export { LOCATION_LABELS };
export default GlobalpingService;
