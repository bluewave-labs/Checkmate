import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import type { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { jobId, type JobSeed } from "@/domain/jobs/job.type.js";
import type { INetworkService } from "@/service/networkService.js";
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
// When egress is down every monitor fails at once, so concurrent failures share one assessment
// rather than each probing. Same in-flight cache shape as ProxyResolver.
const ASSESSMENT_TTL_MS = PROBE_TIMEOUT_MS;
// Global job row (refId null) that re-probes while degraded. Inserted when egress degrades, removed on recovery.
const RECOVERY_JOB_ID = jobId("egress", null);

// Synthetic identity stamped on the probe monitors so provider responses are recognisable in logs.
const PROBE_MONITOR_ID = "egress-probe";
const PROBE_TEAM_ID = "system";

// "[host]:port" or "host:port" where host has no colons (so a bare IPv6 address is not mistaken for host:port).
const HOST_PORT_PATTERN = /^(?:\[([^\]]+)\]|([^:/\s]+)):(\d{1,5})$/;

export interface IEgressService {
	probeTargets(targets: string[]): Promise<EgressProbeResult[]>;
	// Called by the check producer when a check fails. Null when the feature is off or the assessment itself failed.
	assessAfterFailure(): Promise<EgressStatus | null>;
	// Handler for the "egress" job: re-probes while degraded and removes the job once egress is back.
	checkRecovery(): Promise<void>;
}

export class EgressService implements IEgressService {
	static SERVICE_NAME = SERVICE_NAME;

	private assessment: { value: Promise<EgressStatus | null>; expiresAt: number } | null = null;

	constructor(
		private settingsService: ISettingsService,
		private egressStateRepository: IEgressStateRepository,
		private jobsRepository: IJobsRepository,
		private networkService: INetworkService,
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

	private toIntervalMs = (seconds: number | undefined): number => {
		const valid = typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0;
		return (valid ? seconds : DEFAULT_EGRESS_POLL_INTERVAL_SECONDS) * 1000;
	};

	// ****************************
	// Event-triggered assessment
	// ****************************

	assessAfterFailure = (): Promise<EgressStatus | null> => {
		const now = Date.now();
		if (this.assessment && this.assessment.expiresAt > now) {
			return this.assessment.value;
		}
		// Cache the in-flight promise so concurrent failures share one probe
		const value = this.assess();
		this.assessment = { value, expiresAt: now + ASSESSMENT_TTL_MS };
		// Don't cache an internal failure, so the next failing check retries
		void value.then((status) => {
			if (status === null && this.assessment?.value === value) this.assessment = null;
		});
		return value;
	};

	private assess = async (): Promise<EgressStatus | null> => {
		try {
			const settings = await this.settingsService.getDBSettings();
			if (!settings.egressCheckEnabled) {
				return null;
			}

			const state = await this.egressStateRepository.findSingleton();
			if (state.status === "degraded") {
				// Recovery is detected by the scheduled job. Make sure it exists in case its row was lost.
				await this.scheduleRecoveryCheck(settings.egressPollIntervalSeconds);
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
			await this.scheduleRecoveryCheck(settings.egressPollIntervalSeconds);
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
	// Recovery job
	// ****************************

	// upsertJob only sets nextScheduledAt on insert, so re-arming while degraded never pushes a pending run back.
	private scheduleRecoveryCheck = async (pollIntervalSeconds: number | undefined) => {
		const intervalMs = this.toIntervalMs(pollIntervalSeconds);
		const seed: JobSeed = {
			id: RECOVERY_JOB_ID,
			type: "egress",
			refId: null,
			isActive: true,
			nextScheduledAt: Date.now() + intervalMs,
			intervalMs,
		};
		await this.jobsRepository.upsertJob(seed);
	};

	private removeRecoveryJob = async () => {
		await this.jobsRepository.deleteByIdAndType(null, "egress");
	};

	// Runs on the queue at the configured interval while degraded. Errors propagate so the queue records
	// the failure and retries with its usual backoff.
	checkRecovery = async (): Promise<void> => {
		const state = await this.egressStateRepository.findSingleton();
		if (state.status !== "degraded") {
			// Another worker recorded the recovery, or the state was reset; nothing left to poll for.
			await this.removeRecoveryJob();
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
		await this.removeRecoveryJob();
		if (!recovered) {
			// Another process performed the transition.
			return;
		}

		this.logger.info({
			message: `Instance egress recovered (degraded since ${recovered.degradedSince ?? "unknown"})`,
			service: SERVICE_NAME,
			method: "checkRecovery",
			details: { results },
		});
	};
}
