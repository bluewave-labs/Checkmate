import { Proxy } from "@/domain/proxies/proxy.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IProxiesRepository } from "@/domain/proxies/proxy.repository.interface.js";
import { AppError } from "@/utils/AppError.js";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";

export interface IProxiesService {
	createProxy(proxy: Partial<Proxy>, teamId: string): Promise<Proxy>;
	getProxy(proxyId: string, teamId: string): Promise<Proxy>;
	getProxiesByTeamId(teamId: string): Promise<Proxy[]>;
	updateProxy(proxyId: string, teamId: string, patch: Partial<Proxy>): Promise<Proxy>;
	deleteProxy(proxyId: string, teamId: string): Promise<Proxy>;
}

const SERVICE_NAME = "ProxiesService";
export class ProxiesService implements IProxiesService {
	constructor(
		private proxiesRepository: IProxiesRepository,
		private monitorsRepository: IMonitorsRepository,
		private settingsService: ISettingsService
	) {}

	createProxy = async (proxyData: Partial<Proxy>, teamId: string): Promise<Proxy> => {
		proxyData.teamId = teamId;
		return await this.proxiesRepository.create(proxyData);
	};

	getProxy = async (proxyId: string, teamId: string): Promise<Proxy> => {
		return await this.proxiesRepository.findById(proxyId, teamId);
	};

	getProxiesByTeamId = async (teamId: string): Promise<Proxy[]> => {
		return await this.proxiesRepository.findByTeamId(teamId);
	};

	updateProxy = async (proxyId: string, teamId: string, patch: Partial<Proxy>): Promise<Proxy> => {
		return await this.proxiesRepository.updateById(proxyId, teamId, patch);
	};
	deleteProxy = async (proxyId: string, teamId: string): Promise<Proxy> => {
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
		return await this.proxiesRepository.deleteById(proxyId, teamId);
	};
}
