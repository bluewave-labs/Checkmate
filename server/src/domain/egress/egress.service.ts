import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { IProviderRegistry } from "@/service/networkProviders/providerRegistry.js";
import type { IProxyResolver } from "@/service/networkProviders/ProxyResolver.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { DEFAULT_EGRESS_TARGETS, VERDICT_TTL_MS, type EgressProbeResult, type EgressStatus } from "@/domain/egress/egress.type.js";
import { timeRequest } from "@/service/networkProviders/utils.js";
import { parseEgressTarget, type EgressTarget } from "@/utils/egressTarget.js";
import type { IQueueWorkersRepository } from "@/domain/queue-workers/queue-worker.repository.interface.js";
import type { WorkerEgress } from "@/domain/queue-workers/queue-worker.type.js";
const SERVICE_NAME = "EgressService";
const PROBE_TIMEOUT_MS = 5000;

// HttpProvider reports transport failures with NETWORK_ERROR (outside the HTTP range) and everything else with the real status code.
export const isHttpStatusCode = (code: unknown): boolean => typeof code === "number" && code >= 100 && code <= 599;

// Synthetic identity stamped on the probe monitors so provider responses are recognisable in logs.
const PROBE_MONITOR_ID = "egress-probe";
const PROBE_TEAM_ID = "system";

type CachedAssessment = {
	value: Promise<EgressStatus | null>;
	expiresAt: number | null;
	targetsKey: string;
};

export interface IEgressService {
	probeTargets(targets: string[]): Promise<EgressProbeResult[]>;
	// Called by the check producer when a check fails. Null when the feature is off or the assessment itself failed.
	assessAfterFailure(): Promise<EgressStatus | null>;
	shouldClearStatusWindow(monitorId: string): boolean;
}

export class EgressService implements IEgressService {
	static SERVICE_NAME = SERVICE_NAME;

	private assessment: CachedAssessment | null = null;
	private degradedSince: Date | null = null;
	private clearedThisSpell = new Set<string>();

	private logger: ILogger;

	constructor(
		private settingsService: ISettingsService,
		private workerId: string,
		private queueWorkersRepository: IQueueWorkersRepository,
		private providerRegistry: IProviderRegistry,
		private proxyResolver: IProxyResolver,
		logger: ILogger
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
	}

	// ****************************
	// Probing
	// ****************************

	// Reuses the existing ping/port/http providers by dressing each target up as a minimal monitor.
	// proxyMode "inherit" lets the resolver apply the global proxy to http probes, as it does for monitors.
	private toProbeMonitor = (target: EgressTarget, raw: string): Monitor => {
		const base = {
			id: PROBE_MONITOR_ID,
			teamId: PROBE_TEAM_ID,
			name: `Egress probe: ${raw}`,
			method: "GET",
			proxyMode: "inherit",
			useAdvancedMatching: false,
			ignoreTlsErrors: false,
			customUpCodes: [],
		};

		switch (target.kind) {
			case "http":
				return { ...base, type: "http", url: target.url } as unknown as Monitor;
			case "port":
				return { ...base, type: "port", url: target.host, port: target.port } as unknown as Monitor;
			case "ping":
				return { ...base, type: "ping", url: target.host } as unknown as Monitor;
		}
	};

	private probeTarget = async (raw: string): Promise<EgressProbeResult> => {
		const target = parseEgressTarget(raw);
		if (!target) {
			// Validation rejects these; a stored value can still be stale, and it must not count as reachable.
			return { target: raw, reachable: false, responseTime: 0, message: "Invalid egress target" };
		}

		const monitor = this.toProbeMonitor(target, raw);
		let timer: NodeJS.Timeout | undefined;

		const { response, responseTime, error } = await timeRequest(async () => {
			const proxyUrl = await this.proxyResolver.resolve(monitor);
			return Promise.race([
				this.providerRegistry.probe(monitor, { proxyUrl }),
				new Promise<never>((_, reject) => {
					timer = setTimeout(() => reject(new Error(`Egress probe timed out after ${PROBE_TIMEOUT_MS}ms`)), PROBE_TIMEOUT_MS);
				}),
			]).finally(() => clearTimeout(timer));
		});

		if (error || !response) {
			return {
				target: raw,
				reachable: false,
				responseTime,
				message: error instanceof Error ? error.message : error ? String(error) : "No response",
			};
		}

		return {
			target: raw,
			// Any HTTP response, including 4xx/5xx, proves the instance can reach the target; only a transport
			// failure counts against egress. Ping and port providers have no such distinction.
			reachable: response.status === true || (target.kind === "http" && isHttpStatusCode(response.code)),
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
			const settings = await this.settingsService.getCachedDBSettings();
			if (!settings.egressCheckEnabled) return null;
			return await this.sharedAssessment(this.resolveTargets(settings.egressCheckTargets));
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Egress assessment failed");
			return null;
		}
	};

	private sharedAssessment = (targets: string[]): Promise<EgressStatus | null> => {
		const targetsKey = targets.join("\n");
		const cached = this.assessment;

		if (cached && cached.targetsKey === targetsKey && (cached.expiresAt === null || cached.expiresAt > Date.now())) {
			return cached.value;
		}

		const currentAssessment = this.assess(targets);
		const entry: CachedAssessment = { value: currentAssessment, expiresAt: null, targetsKey };
		this.assessment = entry;

		entry.value.then((result) => {
			if (this.assessment !== entry) return;
			if (result === null) {
				this.assessment = null;
			} else {
				entry.expiresAt = Date.now() + VERDICT_TTL_MS;
			}
		});
		return entry.value;
	};

	private publish = async (egress: WorkerEgress) => {
		try {
			await this.queueWorkersRepository.setEgress(this.workerId, egress);
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "Could not publish this worker's egress verdict");
		}
	};

	private applyVerdict = (status: EgressStatus, results: EgressProbeResult[], now: Date) => {
		if (status === "degraded" && this.degradedSince === null) {
			this.degradedSince = now;
			this.logger.warn({ results }, "Egress degraded on this worker: egress targets unreachable");
		} else if (status === "ok" && this.degradedSince !== null) {
			this.logger.info({ degradedSince: this.degradedSince, results }, "Egress recovered for this worker");
			this.degradedSince = null;
			this.clearedThisSpell.clear();
		}
		this.publish({
			status,
			checkedAt: now.getTime(),
			degradedSince: this.degradedSince ? this.degradedSince.getTime() : null,
			lastProbeResults: results,
		});
	};

	private assess = async (targets: string[]): Promise<EgressStatus | null> => {
		try {
			const results = await this.probeTargets(targets);
			const status: EgressStatus = results.some((result) => result.reachable) ? "ok" : "degraded";
			this.applyVerdict(status, results, new Date());
			return status;
		} catch (error: unknown) {
			this.logger.error({ err: error }, "Egress assessment failed");
			return null;
		}
	};

	shouldClearStatusWindow = (monitorId: string): boolean => {
		if (this.degradedSince === null || this.clearedThisSpell.has(monitorId)) {
			return false;
		}
		this.clearedThisSpell.add(monitorId);
		return true;
	};
}
