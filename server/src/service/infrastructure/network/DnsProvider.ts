import type { Resolver } from "dns/promises";
import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { DnsStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { DnsRecordTypes, Monitor, MonitorType } from "@/types/monitor.js";
import type { DnsRecordType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";

const SERVICE_NAME = "DnsProvider";
const TIMEOUT_MS = 10000;

type ResolverConstructor = typeof Resolver;
type ResolverInstance = InstanceType<ResolverConstructor>;

const isDnsRecordType = (value: string): value is DnsRecordType => (DnsRecordTypes as readonly string[]).includes(value);

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

const runQuery = (resolver: ResolverInstance, hostname: string, recordType: DnsRecordType): Promise<unknown> => {
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
	}
};

const normalize = (s: string): string => s.trim().toLowerCase();

const matchesExpected = (results: unknown, recordType: DnsRecordType, expected: string): boolean => {
	const target = normalize(expected);
	if (!target) return true;
	switch (recordType) {
		case "A":
		case "AAAA":
		case "CNAME":
		case "NS":
			return Array.isArray(results) && (results as string[]).some((r) => normalize(r) === target);
		case "TXT":
			return Array.isArray(results) && (results as string[][]).some((chunks) => normalize(chunks.join("")) === target);
		case "MX":
			return Array.isArray(results) && (results as { exchange: string }[]).some((r) => normalize(r.exchange) === target);
	}
};

export class DnsProvider implements IStatusProvider<DnsStatusPayload> {
	readonly type = "dns";

	constructor(private Resolver: ResolverConstructor) {}

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

			const recordType = dnsRecordType.toUpperCase();
			if (!isDnsRecordType(recordType)) {
				throw new AppError({
					message: `Unsupported DNS record type: ${dnsRecordType}`,
					status: 400,
					service: SERVICE_NAME,
					method: "handle",
				});
			}

			const resolver = new this.Resolver();
			if (dnsServer) {
				resolver.setServers([dnsServer]);
			}

			const { response, responseTime, error } = await timeRequest(async () => withTimeout(runQuery(resolver, hostname, recordType), TIMEOUT_MS));

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

			const expected = monitor.expectedValue?.trim();
			if (expected && !matchesExpected(response, recordType, expected)) {
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message: `Resolved records do not match expected value "${expected}"`,
					responseTime,
					payload: {
						hostname,
						dnsServer: dnsServer || "default",
						recordType,
						resolved: true,
						results: response,
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
}
