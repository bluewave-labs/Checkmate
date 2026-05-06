import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { DnsStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";

const SERVICE_NAME = "DnsProvider";
const TIMEOUT_MS = 10000;

interface DnsResolver {
	setServers(servers: string[]): void;
	resolve4(hostname: string): Promise<string[]>;
	resolve6(hostname: string): Promise<string[]>;
	resolveCname(hostname: string): Promise<string[]>;
	resolveMx(hostname: string): Promise<{ exchange: string; priority: number }[]>;
	resolveTxt(hostname: string): Promise<string[][]>;
	resolveNs(hostname: string): Promise<string[]>;
	resolve(hostname: string, rrtype: string): Promise<unknown>;
}

type DnsResolverConstructor = new () => DnsResolver;

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
	new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`DNS query timed out after ${timeoutMs}ms`));
		}, timeoutMs);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(err) => {
				clearTimeout(timer);
				reject(err);
			}
		);
	});

export class DnsProvider implements IStatusProvider<DnsStatusPayload> {
	readonly type = "dns";

	constructor(private Resolver: DnsResolverConstructor) {}

	supports(type: MonitorType): boolean {
		return type === "dns";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<DnsStatusPayload>> {
		try {
			const { url: hostname, dnsServer, dnsRecordType = "A" } = monitor;

			if (!hostname) {
				throw new AppError({
					message: "Hostname is required for DNS monitor",
					status: 400,
					service: SERVICE_NAME,
					method: "handle",
				});
			}

			const resolver = new this.Resolver();
			if (dnsServer) {
				resolver.setServers([dnsServer]);
			}

			const recordType = dnsRecordType.toUpperCase();
			const { response, responseTime, error } = await timeRequest(async () => withTimeout(this.runQuery(resolver, hostname, recordType), TIMEOUT_MS));

			if (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message,
					responseTime,
					payload: {
						hostname,
						dnsServer: dnsServer || "default",
						recordType,
						resolved: false,
						results: null,
					},
				};
			}

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				message: "DNS Resolution Successful",
				responseTime,
				payload: {
					hostname,
					dnsServer: dnsServer || "default",
					recordType,
					resolved: true,
					results: response,
				},
			};
		} catch (err: unknown) {
			if (err instanceof AppError) throw err;
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing DNS check",
				status: 500,
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url, dnsRecordType: monitor.dnsRecordType },
			});
		}
	}

	private runQuery(resolver: DnsResolver, hostname: string, recordType: string): Promise<unknown> {
		switch (recordType) {
			case "A":
				return resolver.resolve4(hostname);
			case "AAAA":
				return resolver.resolve6(hostname);
			case "CNAME":
				return resolver.resolveCname(hostname);
			case "MX":
				return resolver.resolveMx(hostname);
			case "TXT":
				return resolver.resolveTxt(hostname);
			case "NS":
				return resolver.resolveNs(hostname);
			default:
				return resolver.resolve(hostname, recordType);
		}
	}
}
