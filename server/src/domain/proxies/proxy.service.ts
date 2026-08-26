import { Proxy, ProxyResponse, ProxySummary } from "@/domain/proxies/proxy.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IProxiesRepository } from "@/domain/proxies/proxy.repository.interface.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";

export interface IProxiesService {
	createProxy(proxy: Partial<Proxy>, teamId: string): Promise<ProxyResponse>;
	getProxy(proxyId: string, teamId: string): Promise<ProxyResponse>;
	getProxies(): Promise<ProxyResponse[]>;
	getProxySummary(proxyId: string): Promise<ProxySummary | null>;
	getProxiesByTeamId(teamId: string): Promise<ProxyResponse[]>;
	updateProxy(proxyId: string, teamId: string, patch: Partial<Proxy> & { clearPassword?: boolean; clearUsername?: boolean }): Promise<ProxyResponse>;
	deleteProxy(proxyId: string, teamId: string): Promise<ProxyResponse>;
}

const SERVICE_NAME = "ProxiesService";
export class ProxiesService implements IProxiesService {
	constructor(
		private proxiesRepository: IProxiesRepository,
		private monitorsRepository: IMonitorsRepository,
		private settingsService: ISettingsService
	) {}

	private toResponse = ({ password, ...rest }: Proxy): ProxyResponse => ({ ...rest, hasPassword: Boolean(password) });

	createProxy = async (proxyData: Partial<Proxy>, teamId: string): Promise<ProxyResponse> => {
		proxyData.teamId = teamId;
		if (!proxyData.password) {
			delete proxyData.password;
		}
		if (!proxyData.username) {
			delete proxyData.username;
		}
		const raw = await this.proxiesRepository.create(proxyData);
		return this.toResponse(raw);
	};

	getProxy = async (proxyId: string, teamId: string): Promise<ProxyResponse> => {
		const raw = await this.proxiesRepository.findById(proxyId, teamId);
		return this.toResponse(raw);
	};

	getProxies = async (): Promise<ProxyResponse[]> => {
		const raw = await this.proxiesRepository.findAll();
		const clean = raw.map((r) => {
			return this.toResponse(r);
		});
		return clean;
	};

	getProxySummary = async (proxyId: string): Promise<ProxySummary | null> => {
		const proxy = await this.proxiesRepository.findByIdOrNull(proxyId);
		if (!proxy) {
			return null;
		}
		const { id, name, host, port } = proxy;
		return { id, name, host, port };
	};

	getProxiesByTeamId = async (teamId: string): Promise<ProxyResponse[]> => {
		const raw = await this.proxiesRepository.findByTeamId(teamId);
		const clean = raw.map((r) => {
			return this.toResponse(r);
		});
		return clean;
	};

	updateProxy = async (
		proxyId: string,
		teamId: string,
		patch: Partial<Proxy> & { clearPassword?: boolean; clearUsername?: boolean }
	): Promise<ProxyResponse> => {
		// Empty/absent password and username don't delete, clearPassword / clearUsername does
		const { clearPassword, clearUsername, ...proxyPatch } = patch;
		if (!proxyPatch.password) {
			delete proxyPatch.password;
		}
		if (!proxyPatch.username) {
			delete proxyPatch.username;
		}
		const raw = await this.proxiesRepository.updateById(proxyId, teamId, proxyPatch, {
			unsetPassword: clearPassword === true,
			unsetUsername: clearUsername === true,
		});
		return this.toResponse(raw);
	};
	deleteProxy = async (proxyId: string, teamId: string): Promise<ProxyResponse> => {
		// Make sure proxy is not in use
		const monitorsUsingProxy = await this.monitorsRepository.findMonitorCountByProxyId(proxyId);
		if (monitorsUsingProxy > 0) {
			throw new AppError({
				message: `Proxy still in use by ${monitorsUsingProxy} monitor${monitorsUsingProxy > 1 ? "s" : ""}`,
				service: SERVICE_NAME,
				status: 409,
			});
		}

		// Make sure this is not set as a global proxy
		const settings = await this.settingsService.getDBSettings();
		if (settings.globalProxyId === proxyId) {
			throw new AppError({
				message: "Proxy is set as the global proxy in settings",
				service: SERVICE_NAME,
				status: 409,
			});
		}
		const raw = await this.proxiesRepository.deleteById(proxyId, teamId);
		return this.toResponse(raw);
	};
}
