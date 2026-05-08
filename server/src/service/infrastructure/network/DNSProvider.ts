import { DNSStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { Resolver } from "dns/promises";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";

const SERVICE_NAME = "DNSProvider";

export class DNSProvider implements IStatusProvider<DNSStatusPayload> {
	readonly type = "dns";
	constructor(private resolver: Resolver) {}
	supports(type: MonitorType) {
		return type === "dns";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<DNSStatusPayload>> {
		try {
			const { url: hostname, dnsServer, dnsRecordType = "A" } = monitor;
			if (!dnsServer) {
				throw new Error("DNS server is required for DNS monitoring");
			}

			const resolver = new Resolver();
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
