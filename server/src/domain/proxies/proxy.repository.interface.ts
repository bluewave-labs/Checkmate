import { Proxy } from "@/domain/proxies/proxy.type.js";

export interface IProxiesRepository {
	// create
	create(proxyData: Partial<Proxy>): Promise<Proxy>;
	// read
	findAll(): Promise<Proxy[]>;
	findById(proxyId: string, teamId: string): Promise<Proxy>;
	findByIdOrNull(proxyId: string, teamId?: string): Promise<Proxy | null>;
	findByTeamId(teamId: string): Promise<Proxy[]>;
	// update
	updateById(proxyId: string, teamId: string, patch: Partial<Proxy>, options?: { unsetPassword?: boolean; unsetUsername?: boolean }): Promise<Proxy>;
	// delete
	deleteById(proxyId: string, teamId: string): Promise<Proxy>;
}
