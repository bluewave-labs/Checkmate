import { IChecksRepository, IMonitorsRepository, IMonitorStatsRepository } from "@/repositories/index.js";
import type {
	Monitor,
	MonitorStatus,
	MonitorStatusResponse,
	StatusChangeResult,
	Check,
	HardwareStatusPayload,
	PageSpeedStatusPayload,
	PingStatusPayload,
	HttpStatusPayload,
	DockerStatusPayload,
	PortStatusPayload,
	GameStatusPayload,
	GrpcStatusPayload,
	CheckSnapshot,
	CheckDiskInfo,
} from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "./bufferService.js";
import type { HardwareStatusMetrics } from "@/types/network.js";
const SERVICE_NAME = "StatusService";
const MAX_RECENT_CHECKS = 25;
const HARDWARE_ALERT_COUNTER_START = 5;
const HARDWARE_METRIC_KEYS = ["cpu", "memory", "disk", "temp"] as const;
type HardwareMetricKey = (typeof HARDWARE_METRIC_KEYS)[number];
type HardwareBreaches = Record<HardwareMetricKey, boolean>;
type HardwareCounters = Record<HardwareMetricKey, number>;

export interface IStatusService {
	updateRunningStats(monitor: Monitor, networkResponse: MonitorStatusResponse): Promise<boolean>;
	updateMonitorStatus(
		statusResponse: MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
			| undefined
		>,
		check: Check
	): Promise<StatusChangeResult>;
}

export class StatusService implements IStatusService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;
	private buffer: IBufferService;
	private monitorsRepository: IMonitorsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;

	constructor(
		logger: ILogger,
		buffer: IBufferService,
		monitorsRepository: IMonitorsRepository,
		monitorStatsRepository: IMonitorStatsRepository,
		checksRepository: IChecksRepository
	) {
		this.logger = logger;
		this.buffer = buffer;
		this.monitorsRepository = monitorsRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.checksRepository = checksRepository;
	}

	get serviceName() {
		return StatusService.SERVICE_NAME;
	}

	async updateRunningStats(monitor: Monitor, networkResponse: MonitorStatusResponse) {
		try {
			await this.monitorStatsRepository.updateByMonitorId(monitor.id, {
				status: networkResponse.status === true,
				responseTime: networkResponse.responseTime ?? 0,
				now: Date.now(),
			});
			return true;
		} catch (error: unknown) {
			this.logger.error({
				service: SERVICE_NAME,
				message: error instanceof Error ? error.message : "Unknown error",
				method: "updateRunningStats",
				stack: error instanceof Error ? error.stack : undefined,
			});
			return false;
		}
	}

	private tryUpdateRunningStats = async (monitor: Monitor, statusResponse: MonitorStatusResponse) => {
		const statsOk = await this.updateRunningStats(monitor, statusResponse);
		if (!statsOk) {
			this.logger.warn({
				service: SERVICE_NAME,
				method: "updateMonitorStatus",
				message: `Stats update failed for monitor ${monitor.id}`,
			});
		}
	};

	private toCheckSnapshot = (check: Check): CheckSnapshot => {
		return {
			id: check.id,
			status: check.status,
			responseTime: check.responseTime,
			timings: check.timings,
			statusCode: check.statusCode,
			message: check.message,
			cpu: check.cpu,
			memory: check.memory,
			disk: check.disk,
			host: check.host,
			errors: check.errors,
			capture: check.capture,
			net: check.net,
			accessibility: check.accessibility,
			bestPractices: check.bestPractices,
			seo: check.seo,
			performance: check.performance,
			audits: check.audits,
			createdAt: check.createdAt,
		};
	};

	private computeReachability = (
		currentStatus: MonitorStatus,
		window: Array<boolean>,
		threshold: number
	): { nextStatus: "up" | "down"; transitioned: boolean } => {
		const failures = window.filter((status) => status === false).length;
		const failureRate = (failures / window.length) * 100;

		if (failureRate >= threshold && currentStatus !== "down") {
			return { nextStatus: "down", transitioned: true };
		}

		if (failureRate < threshold && currentStatus === "down") {
			return { nextStatus: "up", transitioned: true };
		}
		return { nextStatus: "up", transitioned: false };
	};

	private computeHardwareStatus = (params: {
		currentStatus: MonitorStatus;
		reachabilityDown: boolean;
		metrics: HardwareStatusMetrics;
		thresholds: { cpu: number; memory: number; disk: number; temp: number };
		counters: HardwareCounters;
	}): {
		nextStatus: MonitorStatus;
		transitioned: boolean;
		breaches: HardwareBreaches;
		nextCounters: HardwareCounters;
	} => {
		const { metrics, thresholds, counters, currentStatus, reachabilityDown } = params;

		const cpuUsage = metrics.cpu?.usage_percent ?? -1;
		const memoryUsage = metrics.memory?.usage_percent ?? -1;
		const temps = metrics.cpu?.temperature ?? [];

		const breaches: HardwareBreaches = {
			cpu: cpuUsage !== -1 && cpuUsage > thresholds.cpu / 100,
			memory: memoryUsage !== -1 && memoryUsage > thresholds.memory / 100,
			disk: metrics.disk
				? metrics.disk.some((d: CheckDiskInfo) => d != null && typeof d.usage_percent === "number" && d.usage_percent > thresholds.disk / 100)
				: false,
			temp: temps.some((temp: number) => temp > thresholds.temp),
		};

		// Update counters: decrement (floored at 0) if breached, reset to start otherwise.
		const nextCounters = { ...counters };
		for (const key of HARDWARE_METRIC_KEYS) {
			nextCounters[key] = breaches[key] ? Math.max(0, counters[key] - 1) : HARDWARE_ALERT_COUNTER_START;
		}

		// Status transition: reachability "down" takes precedence; hardware can only drive
		// transitions into "breached" and back out to "up". Any other case leaves status untouched.
		let nextStatus: MonitorStatus = currentStatus;
		let transitioned = false;

		if (!reachabilityDown) {
			// A counter can only reach zero via the decrement path, which only runs when that
			// metric is currently breaching — so anyCounterZero already implies anyBreached.
			const anyCounterZero = HARDWARE_METRIC_KEYS.some((k) => nextCounters[k] === 0);
			const allNormal = HARDWARE_METRIC_KEYS.every((k) => !breaches[k]);

			if (anyCounterZero && currentStatus !== "breached") {
				nextStatus = "breached";
				transitioned = true;
			} else if (allNormal && currentStatus === "breached") {
				nextStatus = "up";
				transitioned = true;
			}
		}

		return { nextStatus, transitioned, breaches, nextCounters };
	};

	updateMonitorStatus = async (
		statusResponse: MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
			| undefined
		>,
		check: Check
	): Promise<StatusChangeResult> => {
		try {
			const { monitorId, teamId, status, code } = statusResponse;
			const monitor = await this.monitorsRepository.findById(monitorId, teamId);

			// Update running stats
			await this.tryUpdateRunningStats(monitor, statusResponse);

			const prevStatus = monitor.status;
			const checkSnapshot = this.toCheckSnapshot(check);

			// Project the window as it will look after updating DB
			// This is done because we need the updated status window to compute new status, but we don't
			// want an an extra DB write just to get the window.
			const projectedWindow = [...(monitor.statusWindow || []), check.status].slice(-monitor.statusWindowSize);

			// Build the status patch — computed against the projected window
			const patch: Partial<Monitor> = {};

			// Resolve "initializing" up-front, incidents should be created on initialization && down
			let newStatus: MonitorStatus = monitor.status;
			let statusChanged = false;
			if (monitor.status === "initializing") {
				newStatus = status === true ? "up" : "down";
				patch.status = newStatus;
				statusChanged = newStatus === "down";
			}

			// Not enough data points yet — record the check and return
			if (projectedWindow.length < monitor.statusWindowSize) {
				const updated = await this.monitorsRepository.updateStatusWindowAndChecks(
					monitor.id,
					monitor.teamId,
					check.status,
					checkSnapshot,
					monitor.statusWindowSize,
					MAX_RECENT_CHECKS,
					patch
				);

				return {
					monitor: updated,
					statusChanged,
					prevStatus,
					code,
					timestamp: Date.now(),
				};
			}

			// First evaluate reachability-based status changes, which apply to all monitor types
			// and take precedence over hardware breaches.
			const reachabilityResult = this.computeReachability(newStatus, projectedWindow, monitor.statusWindowThreshold);
			if (reachabilityResult.transitioned) {
				newStatus = reachabilityResult.nextStatus;
				statusChanged = true;
			}

			// Evaluate hardware threshold breaches (only for hardware monitors with metrics payload)
			let thresholdBreaches: HardwareBreaches | undefined;
			const hardwarePayload = statusResponse.payload as HardwareStatusPayload | undefined;
			if (monitor.type === "hardware" && hardwarePayload?.data) {
				const hardware = this.computeHardwareStatus({
					currentStatus: newStatus,
					reachabilityDown: newStatus === "down",
					metrics: hardwarePayload.data,
					thresholds: {
						cpu: monitor.cpuAlertThreshold,
						memory: monitor.memoryAlertThreshold,
						disk: monitor.diskAlertThreshold,
						temp: monitor.tempAlertThreshold,
					},
					counters: {
						cpu: monitor.cpuAlertCounter,
						memory: monitor.memoryAlertCounter,
						disk: monitor.diskAlertCounter,
						temp: monitor.tempAlertCounter,
					},
				});

				patch.cpuAlertCounter = hardware.nextCounters.cpu;
				patch.memoryAlertCounter = hardware.nextCounters.memory;
				patch.diskAlertCounter = hardware.nextCounters.disk;
				patch.tempAlertCounter = hardware.nextCounters.temp;
				thresholdBreaches = hardware.breaches;
				if (hardware.transitioned) {
					newStatus = hardware.nextStatus;
					statusChanged = true;
				}
			}

			patch.status = newStatus;

			// Single atomic write: push arrays + set status/counters
			const updated = await this.monitorsRepository.updateStatusWindowAndChecks(
				monitor.id,
				monitor.teamId,
				check.status,
				checkSnapshot,
				monitor.statusWindowSize,
				MAX_RECENT_CHECKS,
				patch
			);

			return {
				monitor: updated,
				statusChanged,
				prevStatus,
				code,
				timestamp: new Date().getTime(),
				thresholdBreaches,
			};
		} catch (error: unknown) {
			throw new AppError({
				message: `Failed to update monitor with id ${check.metadata.monitorId} with status: ${error instanceof Error ? error.message : "Unknown error"}`,
				service: SERVICE_NAME,
				method: "updateMonitorStatus",
			});
		}
	};
}
