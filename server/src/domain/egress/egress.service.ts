import type { Monitor } from "@/domain/monitors/monitor.type.js";
import type { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import type { IEgressStateRepository } from "@/domain/egress/egress-state.repository.interface.js";
import type { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { jobId, type Job, type JobSeed } from "@/domain/jobs/job.type.js";
import type { INetworkService } from "@/service/networkService.js";
import type { IProxyResolver } from "@/service/network/ProxyResolver.js";
import type { ILogger } from "@/utils/logger.js";
import {
	DEFAULT_EGRESS_POLL_INTERVAL_SECONDS,
	DEFAULT_EGRESS_TARGETS,
	type EgressAssessment,
	type EgressProbeResult,
	type EgressStatus,
} from "@/domain/egress/egress.type.js";
import { timeRequest } from "@/service/network/utils.js";
import { parseEgressTarget, type EgressTarget } from "@/utils/egressTarget.js";

const SERVICE_NAME = "EgressService";
const PROBE_TIMEOUT_MS = 5000;
// How long a settled assessment answers for later failures. An assessment still in flight is shared
// for as long as it takes, so this only bounds how stale a reused answer can be.
const ASSESSMENT_REUSE_MS = 5000;
// Global job row (refId null) that re-probes while degraded. Inserted when egress degrades, removed on recovery.
const RECOVERY_JOB_TYPE = "egress" as const;
const RECOVERY_JOB_ID = jobId(RECOVERY_JOB_TYPE, null);

// HttpProvider reports transport failures with NETWORK_ERROR (outside the HTTP range) and everything else with the real status code.
const isHttpStatusCode = (code: unknown): boolean => typeof code === "number" && code >= 100 && code <= 599;

// Synthetic identity stamped on the probe monitors so provider responses are recognisable in logs.
const PROBE_MONITOR_ID = "egress-probe";
const PROBE_TEAM_ID = "system";

export interface IEgressService {
	probeTargets(targets: string[]): Promise<EgressProbeResult[]>;
	// Called by the check producer when a check fails. Null when the feature is off or the assessment itself failed.
	assessAfterFailure(): Promise<EgressStatus | null>;
	// Handler for the "egress" job: re-probes while degraded and removes the job once egress is back.
	checkRecovery(job: Job): Promise<void>;
}

type CachedAssessment = {
	value: Promise<EgressAssessment | null>;
	expiresAt: number | null; // null while the assessment is still in flight
};

export class EgressService implements IEgressService {
	static SERVICE_NAME = SERVICE_NAME;

	private assessment: CachedAssessment | null = null;

	constructor(
		private settingsService: ISettingsService,
		private egressStateRepository: IEgressStateRepository,
		private jobsRepository: IJobsRepository,
		private networkService: INetworkService,
		private proxyResolver: IProxyResolver,
		private logger: ILogger
	) {}

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
				this.networkService.requestStatus(monitor, { proxyUrl }),
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

	private toIntervalMs = (seconds: number | undefined): number => {
		const valid = typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0;
		return (valid ? seconds : DEFAULT_EGRESS_POLL_INTERVAL_SECONDS) * 1000;
	};

	// ****************************
	// Event-triggered assessment
	// ****************************

	assessAfterFailure = async (): Promise<EgressStatus | null> => {
		const assessment = await this.sharedAssessment();
		return assessment === "disabled" ? null : assessment;
	};

	// When egress is down every monitor fails at once. Concurrent failures share the in-flight assessment
	// however long it takes, and a settled one answers for ASSESSMENT_REUSE_MS. Same shape as ProxyResolver's cache.
	private sharedAssessment = (): Promise<EgressAssessment | null> => {
		const cached = this.assessment;
		if (cached && (cached.expiresAt === null || cached.expiresAt > Date.now())) {
			return cached.value;
		}

		const entry: CachedAssessment = { value: this.assess(), expiresAt: null };
		this.assessment = entry;
		void entry.value.then((result) => {
			if (this.assessment !== entry) return;
			if (result === null) {
				this.assessment = null; // an internal failure is not cached, so the next failing check retries
			} else {
				entry.expiresAt = Date.now() + ASSESSMENT_REUSE_MS;
			}
		});
		return entry.value;
	};

	private assess = async (): Promise<EgressAssessment | null> => {
		try {
			const settings = await this.settingsService.getCachedDBSettings();
			if (!settings.egressCheckEnabled) {
				return "disabled";
			}

			const state = await this.egressStateRepository.findSingleton();
			if (state.status === "degraded") {
				// Recovery is detected by the scheduled job. Make sure the row exists without touching its schedule.
				await this.scheduleRecoveryCheck(settings.egressPollIntervalSeconds, false);
				return "degraded";
			}

			const results = await this.probeTargets(this.resolveTargets(settings.egressCheckTargets));
			const now = new Date();

			if (results.some((result) => result.reachable)) {
				await this.egressStateRepository.recordProbe(results, now);
				return "ok";
			}

			// Schedule the recovery job before recording the transition: a crash between the two then leaves a stray row
			// while ok, which the job's first run removes, rather than a degraded state that nothing is polling.
			await this.scheduleRecoveryCheck(settings.egressPollIntervalSeconds, true);
			const degraded = await this.egressStateRepository.markDegraded(results, now);
			this.logger.warn({
				message: degraded
					? "Instance egress degraded: every reliability target is unreachable. Monitor failures will not be counted until it recovers"
					: "Instance egress degraded (transition already recorded by another worker)",
				service: SERVICE_NAME,
				method: "assessAfterFailure",
				details: { results },
			});
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

	// reschedule=true sets nextScheduledAt (start of an episode); false only inserts the row if it is missing,
	// so re-arming while degraded never pushes a pending run back.
	private scheduleRecoveryCheck = async (pollIntervalSeconds: number | undefined, reschedule: boolean) => {
		const intervalMs = this.toIntervalMs(pollIntervalSeconds);
		const seed: JobSeed = {
			id: RECOVERY_JOB_ID,
			type: RECOVERY_JOB_TYPE,
			refId: null,
			isActive: true,
			nextScheduledAt: Date.now() + intervalMs,
			intervalMs,
		};
		if (reschedule) {
			await this.jobsRepository.upsertCleanupJob(seed); // global-row upsert that also sets the schedule
		} else {
			await this.jobsRepository.upsertJob(seed);
		}
	};

	// Removes the row only if nobody has rescheduled it since this run claimed it. Another worker may have seen
	// egress fail again in the meantime and started a new episode; its schedule must survive.
	private releaseRecoveryJob = async (job: Job) => {
		await this.jobsRepository.deleteGlobalJobIfUnchanged(RECOVERY_JOB_TYPE, job.nextScheduledAt);
	};

	// Runs on the queue at the configured interval while degraded. Errors propagate so the queue records
	// the failure and retries with its usual backoff.
	checkRecovery = async (job: Job): Promise<void> => {
		const settings = await this.settingsService.getCachedDBSettings();
		const state = await this.egressStateRepository.findSingleton();
		if (!settings.egressCheckEnabled || state.status !== "degraded") {
			// Feature switched off, recovery recorded by another worker, or state reset: nothing left to poll for.
			await this.releaseRecoveryJob(job);
			return;
		}

		const results = await this.probeTargets(this.resolveTargets(settings.egressCheckTargets));
		const now = new Date();

		if (!results.some((result) => result.reachable)) {
			await this.egressStateRepository.recordProbe(results, now);
			return;
		}

		const recovered = await this.egressStateRepository.markRecovered(results, now);
		await this.releaseRecoveryJob(job);
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
