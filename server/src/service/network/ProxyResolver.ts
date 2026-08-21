import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { Monitor } from "@/domain/monitors/monitor.type.js";
import { IProxiesRepository } from "@/domain/proxies/proxy.repository.interface.js";
import { ILogger } from "@/utils/logger.js";
import { Proxy } from "@/domain/proxies/proxy.type.js";

export interface IProxyResolver {
	resolve(monitor: Monitor): Promise<string | undefined>;
}

const SERVICE_NAME = "ProxyResolver";

export const buildProxyUrl = (proxy: Proxy): string => {
	const { protocol, host, port, username, password } = proxy;
	let credentials = "";
	if (username) {
		credentials = password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : `${encodeURIComponent(username)}@`;
	}
	return `${protocol}://${credentials}${host}:${port}`;
};

export class ProxyResolver implements IProxyResolver {
	static SERVICE_NAME = SERVICE_NAME;
	constructor(
		private proxiesRepository: IProxiesRepository,
		private settingsService: ISettingsService,
		private logger: ILogger,
		private ttlMs = 60_000
	) {}

	private cache = new Map<string, { value: Promise<unknown>; expiresAt: number }>();

	private getCached<T>(key: string, fetch: () => Promise<T>): Promise<T> {
		const hit = this.cache.get(key);
		if (hit && hit.expiresAt > Date.now()) {
			return hit.value as Promise<T>;
		}
		// Cache the in flight promise so concurrent misses share one fetch
		const value = fetch();
		this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
		// Don't negative cache rejections, evict so the next resolve retries
		value.catch(() => this.cache.delete(key));
		return value;
	}

	private warn(message: string, monitor: Monitor, error?: unknown) {
		this.logger.warn({
			message,
			service: SERVICE_NAME,
			method: "resolve",
			details: {
				monitorId: monitor.id,
				proxyMode: monitor.proxyMode,
				proxyId: monitor.proxyId,
				...(error instanceof Error ? { error: error.message } : {}),
			},
		});
	}

	private resolveCustom = async (monitor: Monitor): Promise<string | undefined> => {
		const { proxyId, teamId } = monitor;
		if (!proxyId) {
			this.warn("Proxy mode is custom, but proxyId is missing, connecting direct", monitor);
			return undefined;
		}

		const proxy = await this.getCached(`proxy:${proxyId}:${teamId}`, () => this.proxiesRepository.findByIdOrNull(proxyId, teamId));
		if (!proxy) {
			this.warn("Proxy not found, connecting direct", monitor);
			return undefined;
		}
		return buildProxyUrl(proxy);
	};

	private resolveInherit = async (monitor: Monitor): Promise<string | undefined> => {
		const settings = await this.getCached("settings", () => this.settingsService.getDBSettings());
		if (!settings.globalProxyEnabled) {
			return undefined;
		}
		const globalProxyId = settings.globalProxyId;
		if (!globalProxyId) {
			return undefined;
		}
		const proxy = await this.getCached(`proxy:${globalProxyId}`, () => this.proxiesRepository.findByIdOrNull(globalProxyId));
		if (!proxy) {
			this.warn("Global proxy references a proxy that no longer exists, connecting direct", monitor);
			return undefined;
		}
		return buildProxyUrl(proxy);
	};

	async resolve(monitor: Monitor): Promise<string | undefined> {
		if (monitor.type !== "http") {
			return undefined;
		}
		try {
			switch (monitor.proxyMode) {
				case "none":
					return undefined;
				case "custom":
					return await this.resolveCustom(monitor);
				default:
					// "inherit" is the default mode
					return await this.resolveInherit(monitor);
			}
		} catch (error: unknown) {
			this.warn("Proxy resolution failed, connecting direct", monitor, error);
			return undefined;
		}
	}
}
