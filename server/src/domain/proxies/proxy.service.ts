import { Proxy } from "@/domain/proxies/proxy.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IProxiesRepository } from "@/domain/proxies/proxy.repository.interface.js";

export interface IProxiesService {
	createProxy(proxy: Partial<Proxy>, teamId: string): Promise<Proxy>;
	getProxy(proxyId: string, teamId: string): Promise<Proxy>;
	getProxiesByTeamId(teamId: string): Promise<Proxy[]>;
	updateProxy(proxyId: string, teamId: string, patch: Partial<Proxy>): Promise<Proxy>;
	deleteProxy(proxyId: string, teamId: string): Promise<Proxy>;
}

export class ProxiesService implements IProxiesService {
	constructor(
		private proxiesRepository: IProxiesRepository,
		private monitorsRepository: IMonitorsRepository
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
		// TODO guard
		return await this.proxiesRepository.deleteById(proxyId, teamId);
	};
}
