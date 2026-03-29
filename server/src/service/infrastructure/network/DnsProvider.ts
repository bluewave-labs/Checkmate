import { Resolver } from "dns/promises";
import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { DnsStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { NETWORK_ERROR } from "@/service/infrastructure/network/utils.js";

export class DnsProvider implements IStatusProvider<DnsStatusPayload> {
	readonly type = "dns";

	supports(type: MonitorType) {
		return type === "dns";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<DnsStatusPayload>> {
		const { url: hostname, dnsServer, dnsRecordType = "A" } = monitor;

		if (!hostname) {
			throw new Error("Hostname is required for DNS monitor");
		}

		const resolver = new Resolver();
		if (dnsServer) {
			resolver.setServers([dnsServer]);
		}

		const startTime = process.hrtime();

		try {
			let results: unknown;
			switch (dnsRecordType.toUpperCase()) {
				case "A":
					results = await resolver.resolve4(hostname);
					break;
				case "AAAA":
					results = await resolver.resolve6(hostname);
					break;
				case "CNAME":
					results = await resolver.resolveCname(hostname);
					break;
				case "MX":
					results = await resolver.resolveMx(hostname);
					break;
				case "TXT":
					results = await resolver.resolveTxt(hostname);
					break;
				case "NS":
					results = await resolver.resolveNs(hostname);
					break;
				default:
					results = await resolver.resolve(hostname, dnsRecordType);
			}

			const [seconds, nanoseconds] = process.hrtime(startTime);
			const responseTimeMS = Math.round(seconds * 1000 + nanoseconds / 1000000);

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				message: "DNS Resolution Successful",
				responseTime: responseTimeMS,
				payload: {
					hostname,
					dnsServer: dnsServer || "default",
					recordType: dnsRecordType,
					resolved: true,
					results,
				},
			};
		} catch (error: unknown) {
			const [seconds, nanoseconds] = process.hrtime(startTime);
			const responseTimeMS = Math.round(seconds * 1000 + nanoseconds / 1000000);

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: NETWORK_ERROR,
				message: error instanceof Error ? error.message : String(error),
				responseTime: responseTimeMS,
				payload: {
					hostname,
					dnsServer: dnsServer || "default",
					recordType: dnsRecordType,
					resolved: false,
					results: null,
				},
			};
		}
	}
}
