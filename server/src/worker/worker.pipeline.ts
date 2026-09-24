import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { Check } from "@/domain/checks/check.type.js";
import { IDockerLogsService } from "@/domain/docker/docker-log.service.js";
import { IEgressService, isHttpStatusCode } from "@/domain/egress/egress.service.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { PendingCheck } from "@/domain/jobs/job.type.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { isEgressAttributable, Monitor } from "@/domain/monitors/monitor.type.js";
import { IBufferService } from "@/service/bufferService.js";
import { IProxyResolver } from "@/service/network/ProxyResolver.js";
import { INetworkService } from "@/service/networkService.js";
import { IStatusService } from "@/service/statusService.js";
import { DockerStatusPayload, MonitorStatusResponse, StatusChangeResult } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import { IReactorDispatcher } from "@/worker/reactors/reactor.dispatcher.js";
import { JobHandler, MonitorActionDecision, MonitorEvaluation } from "@/worker/worker.interface.js";

const SERVICE_NAME = "WorkerPipeline";
const NO_ACTION: MonitorActionDecision = {
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: false,
	incidentReason: null,
	notificationReason: null,
};
// The three entry points: the queue calls the two handlers, the buffer calls ingestChecks.
// produce and evaluateCheck stay public on the class so tests can drive one stage without the queue or the buffer.
export interface IWorkerPipeline {
	handleCheck: JobHandler;
	ingestChecks(checks: Check[]): Promise<void>;
	handleEvaluate: JobHandler;
}

export interface WorkerPipelineDependencies {
	logger: ILogger;
	monitorsRepository: IMonitorsRepository;
	maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	checksRepository: IChecksRepository;
	jobsRepository: IJobsRepository;
	checkService: ICheckService;
	networkService: INetworkService;
	proxyResolver: IProxyResolver;
	bufferService: IBufferService;
	dockerLogsService: IDockerLogsService;
	egressService: IEgressService;
	statusService: IStatusService;
	dispatcher: IReactorDispatcher;
}

export class WorkerPipeline implements IWorkerPipeline {
	static SERVICE_NAME = SERVICE_NAME;

	private unarmed: Map<string, PendingCheck[]> = new Map();

	constructor(private deps: WorkerPipelineDependencies) {}

	private isInMaintenanceWindow = async (monitorId: string, teamId: string) => {
		const windows = await this.deps.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		const now = new Date();
		return windows.some((window) => isWindowActive(window, now));
	};

	// ****************************************************************
	// Stage 1: Check job. Probe the host and buffer the result.
	// ****************************************************************

	handleCheck: JobHandler = async (job) => {
		if (!job.refId) return;
		const monitor = await this.deps.monitorsRepository.findByIdLean(job.refId);
		if (!monitor) return;
		await this.produce(monitor);
	};

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
			this.deps.logger.debug({
				message: `Monitor ${monitor.id} is in maintenance window`,
				service: SERVICE_NAME,
				method: "produce",
			});
			if (monitor.status !== "maintenance") {
				// Clear the status window to avoid incidents being created on next check
				await this.deps.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "maintenance", statusWindow: [] });
			}
			return null;
		}

		// Leaving the window is explicit rather than a side effect of evaluating the resulting check, which the
		// degraded-egress short-circuit skips. "initializing" is resolved to up or down by the first check that is
		// evaluated, so the monitor cannot sit in "maintenance" for the length of an egress outage.
		if (monitor.status === "maintenance") {
			monitor = await this.deps.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "initializing" });
		}

		// Step 1b: Acquire status
		const proxyUrl = await this.deps.proxyResolver.resolve(monitor);
		const dockerTlsKey = await this.resolveDockerTlsKey(monitor);

		const status = await this.deps.networkService.requestStatus(monitor, { proxyUrl, dockerTlsKey });
		if (!status) {
			throw new Error("No network response");
		}

		// ****************************
		// Step 2: Record
		// ****************************

		// Step 2a:  Create & record a check, return null if fail.
		// Built before the egress assessment below so that the probe's duration stays out of `createdAt`.
		const check = this.deps.checkService.toCheck(status);
		if (!check) {
			this.deps.logger.warn({
				message: `No check could be built for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "produce",
				details: { code: status.code, message: status.message },
			});
			return null;
		}

		// Step 2b: On a transport failure, ask whether the instance itself can reach anything before blaming the
		// target. Null means the egress check is disabled (or failed internally) and the check is treated as usual.
		const egressStatus = this.isTransportFailure(monitor, status) ? await this.deps.egressService.assessAfterFailure() : null;
		if (egressStatus !== null) {
			check.egressStatus = egressStatus;
		}

		// Step 2c: Add to buffer
		this.deps.bufferService.addToBuffer(check);

		// Step 2d: As with the maintenance gate above, the window is cleared at the point the monitor stops
		// being evaluated, so the results either side of a spell never end up adjacent and cross the threshold
		// on stale data. The length guard keeps this to one write per spell rather than one per degraded check,
		// and it runs after the check is buffered so that a failed write cannot cost us the check.
		if (egressStatus === "degraded" && monitor.statusWindow?.length) {
			await this.deps.monitorsRepository.updateById(monitor.id, monitor.teamId, { statusWindow: [] });
		}

		// Step 2e: Handle docker logs
		if (status.type === "docker") {
			const dockerLogs = await this.deps.dockerLogsService.buildDockerLogs(status as MonitorStatusResponse<DockerStatusPayload>);
			for (const dockerLog of dockerLogs) {
				this.deps.bufferService.addDockerLogToBuffer(dockerLog);
			}
		}
		return { status, check };
	};

	private async resolveDockerTlsKey(monitor: Monitor): Promise<string | undefined> {
		if (monitor.type !== "docker" || !monitor.dockerTlsKeySet || !monitor.id) return undefined;
		const dockerTlsKey = await this.deps.monitorsRepository.findDockerTlsKeyById(monitor.id);
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

	// ****************************************************************
	// Stage 2: Ingestion
	// Called by the buffer, checks are inserted and evaluation jobs created
	// ****************************************************************

	ingestChecks = async (checks: Check[]) => {
		if (checks.length > 0) await this.deps.checkService.createChecks(checks);

		// Group by monitor, starting from any entries a previous flush failed to arm
		const byMonitor = this.unarmed;
		this.unarmed = new Map();
		for (const check of checks) {
			const pending = byMonitor.get(check.metadata.monitorId) ?? [];
			pending.push({ checkId: check.id, createdAt: new Date(check.createdAt).getTime() });
			byMonitor.set(check.metadata.monitorId, pending);
		}
		if (byMonitor.size === 0) return;

		const now = Date.now();
		const ops: Promise<boolean>[] = [];
		for (const [monitorId, pendingChecks] of byMonitor) {
			ops.push(
				this.deps.jobsRepository.upsertEvaluate(monitorId, pendingChecks, now).catch((error: unknown) => {
					// The checks are already stored, so a failed arm is retried on the next ingest rather than dropped
					this.unarmed.set(monitorId, pendingChecks);
					this.deps.logger.error({
						message: `Could not arm evaluation for monitor ${monitorId}, retrying on next ingest: ${error instanceof Error ? error.message : String(error)}`,
						service: SERVICE_NAME,
						method: "ingestChecks",
					});
					return false;
				})
			);
		}
		await Promise.all(ops);
	};

	// ****************************************************************
	// Stage 3: Evaluation
	// Apply each pending check to the monitor -> decide -> react.
	// ****************************************************************

	handleEvaluate: JobHandler = async (job) => {
		if (!job.refId || job.pendingChecks.length === 0) return;
		const pendingCheckIds = job.pendingChecks.map((entry) => entry.checkId);

		const monitor = await this.deps.monitorsRepository.findByIdLean(job.refId); // job row has no teamId
		if (!monitor) {
			await this.deps.jobsRepository.pullEvaluated(job.id, pendingCheckIds);
			return;
		}
		const checks = await this.deps.checksRepository.findUnevaluatedByMonitorId(job.refId, job.pendingChecks);

		let current = monitor;
		for (const check of checks) {
			const evaluation = await this.evaluateCheck(check, current);
			await this.deps.dispatcher.dispatch(evaluation); // Handle incidents and notifications
			const leaseHeld = await this.deps.jobsRepository.pullEvaluated(job.id, [check.id]);
			if (!leaseHeld) {
				// Another worker has claimed this row and is evaluating the remaining ids; stop here so nothing is applied twice
				this.deps.logger.warn({
					message: `Lost lease on ${job.id} after check ${check.id}, stopping`,
					service: SERVICE_NAME,
					method: "handleEvaluate",
				});
				return;
			}
			current = evaluation.monitor; // fresh statusWindow/status/counters for the next check
		}

		// Ids whose check was not returned (deleted by retention cleanup) would otherwise sit on the row forever
		const found = new Set(checks.map((check) => check.id));
		const missing = pendingCheckIds.filter((checkId) => !found.has(checkId));
		if (missing.length > 0) {
			this.deps.logger.warn({
				message: `Dropping ${missing.length} pending checks with no stored check: ${missing.join(", ")}`,
				service: SERVICE_NAME,
				method: "handleEvaluate",
			});
			await this.deps.jobsRepository.pullEvaluated(job.id, missing);
		}
	};

	// A check taken while the instance had no outbound connectivity says nothing about the target.
	// It is left out of the status window, running stats and monitor status entirely, so that no incident
	// opens for it and no spurious "resolved"/"up" fires once egress returns.
	private skipDegradedEgressCheck = (check: Check, monitor: Monitor): MonitorEvaluation => {
		this.deps.logger.debug({
			message: `Skipping evaluation of check ${check.id} for monitor ${monitor.id}: instance egress was degraded`,
			service: SERVICE_NAME,
			method: "evaluateCheck",
		});

		return {
			monitor,
			check,
			decision: { ...NO_ACTION },
		};
	};

	evaluateCheck = async (check: Check, monitor: Monitor): Promise<MonitorEvaluation> => {
		if (check.egressStatus === "degraded") {
			return this.skipDegradedEgressCheck(check, monitor);
		}

		const statusChange = await this.deps.statusService.updateMonitorStatus(check, monitor);

		const decision = this.decide(statusChange);
		return { monitor: statusChange.monitor, check, decision };
	};

	private decide = (statusChange: StatusChangeResult): MonitorActionDecision => {
		const { monitor, statusChanged, prevStatus } = statusChange;
		const decision: MonitorActionDecision = { ...NO_ACTION };
		if (!statusChanged) return decision;

		if (monitor.status === "down") {
			decision.shouldCreateIncident = true;
			decision.shouldSendNotification = true;
			decision.incidentReason = "status_down";
			decision.notificationReason = "status_change";
		} else if (monitor.status === "breached") {
			decision.thresholdBreaches = statusChange.thresholdBreaches;
			decision.shouldCreateIncident = true;
			decision.shouldSendNotification = true;
			decision.incidentReason = "threshold_breach";
			decision.notificationReason = "threshold_breach";
		} else if (monitor.status === "up" && prevStatus === "breached") {
			decision.shouldResolveIncident = true;
			decision.shouldSendNotification = true;
			decision.notificationReason = "threshold_resolved";
		} else if (monitor.status === "up" && prevStatus === "down") {
			decision.shouldResolveIncident = true;
			decision.shouldSendNotification = true;
			decision.notificationReason = "status_change";
		}
		return decision;
	};
}
