import { DNSStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import dns from "dns";
import type { Resolver } from "dns/promises";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { AppError } from "@/utils/AppError.js";
import { timeRequest } from "@/service/network/utils.js";
import { NETWORK_ERROR } from "@/types/network.js";

const SERVICE_NAME = "DNSProvider";

// c-ares codes where the DNS server replied: the name does not exist, holds no such record, or the server
// declined or answered badly. Anything else (timeout, connection refused, a local resolver fault) means we
// never got an answer, so the failure could be our own loss of egress rather than the target's.
const ANSWERED_DNS_CODES: ReadonlySet<string> = new Set([dns.NODATA, dns.FORMERR, dns.SERVFAIL, dns.NOTFOUND, dns.NOTIMP, dns.REFUSED, dns.BADRESP]);

const dnsServerAnswered = (error: unknown): boolean => {
	const code = (error as NodeJS.ErrnoException | undefined)?.code;
	return typeof code === "string" && ANSWERED_DNS_CODES.has(code);
};

export class DNSProvider implements IStatusProvider<DNSStatusPayload> {
	readonly type = "dns";
	constructor(private createResolver: () => Resolver) {}
	supports(type: MonitorType) {
		return type === "dns";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<DNSStatusPayload>> {
		try {
			const { url, dnsServer, dnsRecordType = "A" } = monitor;
			if (!dnsServer) {
				throw new Error("DNS server is required for DNS monitoring");
			}

			let hostname: string;
			try {
				const withScheme = /^[a-z]+:\/\//i.test(url) ? url : `http://${url}`; // Ensure URL has a scheme for proper parsing
				hostname = new URL(withScheme).hostname;
			} catch {
				hostname = url;
			}

			const resolver = this.createResolver();
			resolver.setServers([dnsServer]);

			const {
				response: results,
				responseTime,
				error,
			} = await timeRequest(() => {
				switch (dnsRecordType.toUpperCase()) {
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
						return resolver.resolve(hostname, dnsRecordType);
				}
			});

			if (error) {
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					peerResponded: dnsServerAnswered(error),
					message: error instanceof Error ? error.message : String(error),
					responseTime,
					payload: {
						hostname,
						dnsServer,
						recordType: dnsRecordType,
						resolved: false,
						results,
					},
				};
			}

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				peerResponded: true,
				message: "Success",
				responseTime,
				payload: {
					hostname,
					dnsServer,
					recordType: dnsRecordType,
					resolved: true,
					results,
				},
			};
		} catch (error: unknown) {
			const originalMessage = error instanceof Error ? error.message : String(error);
			throw new AppError({
				message: originalMessage || "Error performing DNS check",
				status: 500,
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url },
			});
		}
	}
}
