export const ProxyProtocols = ["http", "https"] as const;
export type ProxyProtocol = (typeof ProxyProtocols)[number];

export interface Proxy {
	id: string;
	teamId: string;
	name: string;
	protocol: ProxyProtocol;
	host: string;
	port: number;
	username?: string;
	password?: string;
	createdAt: string;
	updatedAt: string;
}

export type ProxyResponse = Omit<Proxy, "password"> & { hasPassword: boolean };
