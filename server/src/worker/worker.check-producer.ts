import { Monitor } from "@/domain/monitors/monitor.type.js";
import { Check } from "@/domain/checks/check.type.js";
import { DockerStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "@/service/bufferService.js";
import { INetworkService } from "@/service/networkService.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import { IProxyResolver } from "@/service/network/ProxyResolver.js";
import { IDockerLogsService } from "@/domain/docker/docker-log.service.js";
import { IEgressService, isHttpStatusCode } from "@/domain/egress/egress.service.js";
import type { EgressStatus } from "@/domain/egress/egress.type.js";
import { isEgressAttributable } from "@/domain/monitors/monitor.type.js";

export interface ICheckProducer {
	produce(monitor: Monitor): Promise<{ status: MonitorStatusResponse; check: Check } | null>;
}

const SERVICE_NAME = "CheckProducer";

export class CheckProducer implements ICheckProducer {
	constructor(
		private monitorsRepository: IMonitorsRepository,
		private maintenanceWindowsRepository: IMaintenanceWindowsRepository,
		private checkService: ICheckService,
		private networkService: INetworkService,
		private proxyResolver: IProxyResolver,
		private bufferService: IBufferService,
		private dockerLogsService: IDockerLogsService,
		private egressService: IEgressService,
		private logger: ILogger
	) {}

	private async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const windows = await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		const now = new Date();
		return windows.some((w) => isWindowActive(w, now));
	}

	private async resolveDockerTlsKey(monitor: Monitor): Promise<string | undefined> {
		if (monitor.type !== "docker" || !monitor.dockerTlsKeySet || !monitor.id) return undefined;
		const dockerTlsKey = await this.monitorsRepository.findDockerTlsKeyById(monitor.id);
		return dockerTlsKey ?? undefined;
	}

	// Only a failure to reach the target at all can be the instance's own fault. A provider that can tell the
	// two apart says so outright; for the rest, any HTTP status code proves the target answered (a 4xx, a 5xx,
	// or a 200 with a content mismatch).
	private peerAnswered(status: MonitorStatusResponse): boolean {
		return status.peerResponded ?? isHttpStatusCode(status.code);
	}

	private isTransportFailure(monitor: Monitor, status: MonitorStatusResponse): boolean {
		return status.status === false && isEgressAttributable(monitor) && !this.peerAnswered(status);
	}

	// The egress check must never stop a check being recorded, so a rejection is logged and treated as unknown.
	private async assessEgress(monitorId: string): Promise<EgressStatus | null> {
		try {
			return await this.egressService.assessAfterFailure();
		} catch (error: unknown) {
			this.logger.warn({
				message: `Egress assessment failed for monitor ${monitorId}: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				method: "assessEgress",
			});
			return null;
		}
	}

	produce = async (monitor: Monitor) => {
		if (!monitor.id) {
			throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "produce" });
		}
		// ****************************
		// Step 1:  Acquire
		// ****************************

		// Step 1a:  Maintenance window gate - skip if in maintenance
		const maintenanceWindowActive = await this.isInMaintenanceWindow(monitor.id, monitor.teamId);
		if (maintenanceWindowActive) {
			this.logger.debug({
				message: `Monitor ${monitor.id} is in maintenance window`,
				service: SERVICE_NAME,
				method: "produce",
			});
			if (monitor.status !== "maintenance") {
				// Clear the status window to avoid incidents being created on next check
				await this.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "maintenance", statusWindow: [] });
			}
			return null;
		}

		// Leaving the window is explicit rather than a side effect of evaluating the resulting check, which the
		// degraded-egress short-circuit skips. "initializing" is resolved to up or down by the first check that is
		// evaluated, so the monitor cannot sit in "maintenance" for the length of an egress outage.
		if (monitor.status === "maintenance") {
			monitor = await this.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "initializing" });
		}

		// Step 1b: Acquire status
		const proxyUrl = await this.proxyResolver.resolve(monitor);
		const dockerTlsKey = await this.resolveDockerTlsKey(monitor);

		const status = await this.networkService.requestStatus(monitor, { proxyUrl, dockerTlsKey });
		if (!status) {
			throw new Error("No network response");
		}

		// ****************************
		// Step 2: Record
		// ****************************

		// Step 2a:  Create & record a check, return null if fail.
		// Built before the egress assessment below so that the probe's duration stays out of `createdAt`.
		const check = this.checkService.toCheck(status);
		if (!check) {
			this.logger.warn({
				message: `No check could be built for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "produce",
				details: { code: status.code, message: status.message },
			});
			return null;
		}

		// Step 2b: On a transport failure, ask whether the instance itself can reach anything before blaming the
		// target. Null means the egress check is disabled (or failed internally) and the check is treated as usual.
		const egressStatus = this.isTransportFailure(monitor, status) ? await this.assessEgress(monitor.id) : null;
		if (egressStatus !== null) {
			check.egressStatus = egressStatus;
		}

		// Step 2c: Add to buffer
		this.bufferService.addToBuffer(check);

		// Step 2d: As with the maintenance gate above, the window is cleared at the point the monitor stops
		// being evaluated, so the results either side of a spell never end up adjacent and cross the threshold
		// on stale data. The length guard keeps this to one write per spell rather than one per degraded check,
		// and it runs after the check is buffered so that a failed write cannot cost us the check.
		if (egressStatus === "degraded" && monitor.statusWindow?.length) {
			await this.monitorsRepository.updateById(monitor.id, monitor.teamId, { statusWindow: [] });
		}

		// Step 2e: Handle docker logs
		if (status.type === "docker") {
			const dockerLogs = await this.dockerLogsService.buildDockerLogs(status as MonitorStatusResponse<DockerStatusPayload>);
			for (const dockerLog of dockerLogs) {
				this.bufferService.addDockerLogToBuffer(dockerLog);
			}
		}
		return { status, check };
	};
}
