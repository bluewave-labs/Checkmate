import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import type { INetworkService } from "@/service/networkService.js";
import type { INotificationsService } from "@/domain/notifications/notification.service.js";
import type { ILogger } from "@/utils/logger.js";
import {
	DEFAULT_EGRESS_POLL_INTERVAL_SECONDS,
	DEFAULT_EGRESS_TARGETS,
	type EgressProbeResult,
	type EgressStatus,
} from "@/domain/egress/egress.type.js";
import { timeRequest } from "@/service/network/utils.js";

const SERVICE_NAME = "EgressService";
const PROBE_TIMEOUT_MS = 5000;

// Synthetic identity stamped on the probe monitors so provider responses are recognisable in logs.
const PROBE_MONITOR_ID = "egress-probe";
const PROBE_TEAM_ID = "system";

// "[host]:port" or "host:port" where host has no colons (so a bare IPv6 address is not mistaken for host:port).
const HOST_PORT_PATTERN = /^(?:\[([^\]]+)\]|([^:/\s]+)):(\d{1,5})$/;

export interface IEgressService {
	probeTargets(targets: string[]): Promise<EgressProbeResult[]>;
	assessAfterFailure(): Promise<EgressStatus | null>;
	startRecoveryPolling(): void;
	stop(): void;
	init(): Promise<void>;
}

export class EgressService implements IEgressService {
	static SERVICE_NAME = SERVICE_NAME;

	private polling = false;
	private pollTimer: NodeJS.Timeout | null = null;

	constructor(
		private settingsService: ISettingsService,
		private egressStateRepository: IEgressStateRepository,
		private networkService: INetworkService,
		private notificationsService: INotificationsService,
		private logger: ILogger
	) {}

	// ****************************
	// Probing
	// ****************************

	// Reuses the existing ping/port/http providers by dressing each target up as a minimal monitor.
	private toProbeMonitor = (target: string): Monitor => {
		const base = {
			id: PROBE_MONITOR_ID,
			teamId: PROBE_TEAM_ID,
			name: `Egress probe: ${target}`,
			method: "GET",
			useAdvancedMatching: false,
			ignoreTlsErrors: false,
			customUpCodes: [],
		};

		if (/^https?:\/\//i.test(target)) {
			return { ...base, type: "http", url: target } as unknown as Monitor;
		}

		const hostPort = HOST_PORT_PATTERN.exec(target);
		if (hostPort) {
			const host = hostPort[1] ?? hostPort[2];
			return { ...base, type: "port", url: host, port: Number(hostPort[3]) } as unknown as Monitor;
		}

		return { ...base, type: "ping", url: target } as unknown as Monitor;
	};

	private probeTarget = async (target: string): Promise<EgressProbeResult> => {
		const monitor = this.toProbeMonitor(target);
		let timer: NodeJS.Timeout | undefined;

		const { response, responseTime, error } = await timeRequest(() =>
			Promise.race([
				this.networkService.requestStatus(monitor),
				new Promise<never>((_, reject) => {
					timer = setTimeout(() => reject(new Error(`Egress probe timed out after ${PROBE_TIMEOUT_MS}ms`)), PROBE_TIMEOUT_MS);
				}),
			]).finally(() => clearTimeout(timer))
		);

		if (error || !response) {
			return {
				target,
				reachable: false,
				responseTime,
				message: error instanceof Error ? error.message : error ? String(error) : "No response",
			};
		}

		return {
			target,
			reachable: response.status === true,
			responseTime: response.responseTime ?? responseTime,
			message: response.message,
		};
	};

	probeTargets = async (targets: string[]): Promise<EgressProbeResult[]> => {
		return await Promise.all(targets.map((target) => this.probeTarget(target)));
	};

	private resolveTargets = (configured: string[] | undefined): string[] => {
		const targets = (configured ?? []).map((target) => target.trim()).filter((target) => target.length > 0);
		// An empty list would make "all unreachable" vacuously true, so fall back to the defaults.
		return targets.length > 0 ? targets : [...DEFAULT_EGRESS_TARGETS];
	};

	// ****************************
	// Event-triggered assessment
	// ****************************

	assessAfterFailure = async (): Promise<EgressStatus | null> => {
		try {
			const settings = await this.settingsService.getDBSettings();
			if (!settings.egressCheckEnabled) {
				return null;
			}

			const state = await this.egressStateRepository.findSingleton();
			if (state.status === "degraded") {
				// Recovery detection belongs to the poll loop. Make sure one is running in this process in case
				// the worker that entered the degraded state is no longer around.
				this.startRecoveryPolling();
				return "degraded";
			}

			const results = await this.probeTargets(this.resolveTargets(settings.egressCheckTargets));
			const now = new Date();

			if (results.some((result) => result.reachable)) {
				await this.egressStateRepository.recordProbe(results, now);
				return "ok";
			}

			const degraded = await this.egressStateRepository.markDegraded(results, now);
			this.logger.warn({
				message: degraded
					? "Instance egress degraded: every reliability target is unreachable. Monitor failures will not be counted until it recovers"
					: "Instance egress degraded (transition already recorded by another worker)",
				service: SERVICE_NAME,
				method: "assessAfterFailure",
				details: { results },
			});
			this.startRecoveryPolling();
			return "degraded";
		} catch (error: unknown) {
			// The egress check must never break check production; treat an internal failure as "unknown" and carry on.
			this.logger.error({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: "assessAfterFailure",
				stack: error instanceof Error ? error.stack : undefined,
			});
			return null;
		}
	};

	// ****************************
	// Recovery poll loop
	// ****************************

	startRecoveryPolling = () => {
		if (this.polling) {
			return;
		}
		this.polling = true;
		this.logger.info({ message: "Starting egress recovery polling", service: SERVICE_NAME, method: "startRecoveryPolling" });
		void this.scheduleNextTick();
	};

	stop = () => {
		this.polling = false;
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
			this.pollTimer = null;
		}
	};

	private readPollIntervalMs = async () => {
		try {
			const settings = await this.settingsService.getDBSettings();
			const seconds = settings.egressPollIntervalSeconds;
			return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_EGRESS_POLL_INTERVAL_SECONDS) * 1000;
		} catch (error: unknown) {
			this.logger.warn({
				message: `Could not read egress poll interval, using default: ${error instanceof Error ? error.message : String(error)}`,
				service: SERVICE_NAME,
				method: "readPollIntervalMs",
			});
			return DEFAULT_EGRESS_POLL_INTERVAL_SECONDS * 1000;
		}
	};

	private scheduleNextTick = async () => {
		if (!this.polling) {
			return;
		}
		const intervalMs = await this.readPollIntervalMs();
		if (!this.polling) {
			return;
		}
		this.pollTimer = setTimeout(() => void this.tick(), intervalMs);
		// Never hold the process open for this loop; the state is persisted and init() resumes it on restart.
		this.pollTimer.unref();
	};

	private tick = async () => {
		this.pollTimer = null;
		if (!this.polling) {
			return;
		}

		try {
			const state = await this.egressStateRepository.findSingleton();
			if (state.status !== "degraded") {
				this.logger.info({ message: "Egress no longer degraded, stopping recovery polling", service: SERVICE_NAME, method: "tick" });
				this.stop();
				return;
			}

			const settings = await this.settingsService.getDBSettings();
			const results = await this.probeTargets(this.resolveTargets(settings.egressCheckTargets));
			const now = new Date();

			if (!results.some((result) => result.reachable)) {
				await this.egressStateRepository.recordProbe(results, now);
				return;
			}

			const recovered = await this.egressStateRepository.markRecovered(results, now);
			this.stop();
			if (!recovered) {
				// Another process performed the transition and owns the notification.
				return;
			}

			this.logger.info({
				message: `Instance egress recovered (degraded since ${recovered.degradedSince ?? "unknown"})`,
				service: SERVICE_NAME,
				method: "tick",
				details: { results },
			});
			await this.notificationsService.sendEgressRecoveredNotification(recovered, settings.egressNotifications ?? []);
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: "tick",
				stack: error instanceof Error ? error.stack : undefined,
			});
		} finally {
			// No-op once stop() has been called; otherwise keep the loop alive through errors.
			await this.scheduleNextTick();
		}
	};

	// ****************************
	// Lifecycle
	// ****************************

	init = async () => {
		try {
			const settings = await this.settingsService.getDBSettings();
			if (!settings.egressCheckEnabled) {
				return;
			}
			const state = await this.egressStateRepository.findSingleton();
			if (state.status === "degraded") {
				this.logger.warn({
					message: `Instance egress was degraded at startup (since ${state.degradedSince ?? "unknown"}), resuming recovery polling`,
					service: SERVICE_NAME,
					method: "init",
				});
				this.startRecoveryPolling();
			}
		} catch (error: unknown) {
			this.logger.error({
				message: error instanceof Error ? error.message : String(error),
				service: SERVICE_NAME,
				method: "init",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}
