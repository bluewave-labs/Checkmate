const SERVICE_NAME = "DLQService";

import type { DLQItem, DLQItemType } from "@/types/index.js";
import type { IDLQRepository, DLQQueryFilters, DLQStatusCount } from "@/repositories/index.js";
import type { INotificationsService } from "@/service/infrastructure/notificationsService.js";
import type { IIncidentService } from "@/service/business/incidentService.js";
import type { IMonitorsRepository } from "@/repositories/index.js";
import type { ILogger } from "@/utils/logger.js";

const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 3_600_000;
const DEFAULT_MAX_RETRIES = 5;
const STALENESS_THRESHOLD_MS = 30 * 60 * 1000;
const RETRY_BATCH_SIZE = 20;

export interface IDLQService {
	enqueue(type: DLQItemType, payload: Record<string, unknown>, monitorId: string, teamId: string, error: string): Promise<DLQItem>;
	processRetries(): Promise<void>;
	retryItem(id: string): Promise<DLQItem | null>;
	getItems(teamId: string, filters: DLQQueryFilters): Promise<{ items: DLQItem[]; count: number }>;
	getSummary(teamId: string): Promise<DLQStatusCount[]>;
	purge(id: string, teamId: string): Promise<number>;
	cleanup(ttlDays: number): Promise<number>;
}

export class DLQService implements IDLQService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(
		private dlqRepository: IDLQRepository,
		private notificationsService: INotificationsService,
		private incidentService: IIncidentService,
		private monitorsRepository: IMonitorsRepository,
		private logger: ILogger
	) {}

	get serviceName() {
		return DLQService.SERVICE_NAME;
	}

	enqueue = async (
		type: DLQItemType,
		payload: Record<string, unknown>,
		monitorId: string,
		teamId: string,
		error: string
	): Promise<DLQItem> => {
		const nextRetryAt = new Date(Date.now() + BASE_DELAY_MS).toISOString();
		const item = await this.dlqRepository.create({
			type,
			status: "pending",
			payload,
			monitorId,
			teamId,
			retryCount: 0,
			maxRetries: DEFAULT_MAX_RETRIES,
			lastError: error,
			nextRetryAt,
		});
		this.logger.info({
			message: `Enqueued DLQ item: type=${type} monitor=${monitorId}`,
			service: SERVICE_NAME,
			method: "enqueue",
		});
		return item;
	};

	processRetries = async (): Promise<void> => {
		const items = await this.dlqRepository.findRetryable(RETRY_BATCH_SIZE);
		if (items.length === 0) {
			return;
		}
		this.logger.info({
			message: `Processing ${items.length} DLQ items for retry`,
			service: SERVICE_NAME,
			method: "processRetries",
		});
		for (const item of items) {
			try {
				await this.executeRetry(item);
				await this.dlqRepository.deleteById(item.id, item.teamId);
				this.logger.info({
					message: `DLQ item ${item.id} retried successfully, removed`,
					service: SERVICE_NAME,
					method: "processRetries",
				});
			} catch (error: unknown) {
				const newRetryCount = item.retryCount + 1;
				const errorMessage = error instanceof Error ? error.message : "Unknown error";

				if (newRetryCount >= item.maxRetries) {
					await this.dlqRepository.updateById(item.id, {
						status: "failed",
						retryCount: newRetryCount,
						lastError: errorMessage,
					});
					this.logger.warn({
						message: `DLQ item ${item.id} permanently failed after ${newRetryCount} retries`,
						service: SERVICE_NAME,
						method: "processRetries",
					});
				} else {
					const delay = Math.min(BASE_DELAY_MS * Math.pow(2, newRetryCount), MAX_DELAY_MS);
					const nextRetryAt = new Date(Date.now() + delay).toISOString();
					await this.dlqRepository.updateById(item.id, {
						status: "retrying",
						retryCount: newRetryCount,
						lastError: errorMessage,
						nextRetryAt,
					});
					this.logger.debug({
						message: `DLQ item ${item.id} retry ${newRetryCount}/${item.maxRetries} failed, next retry at ${nextRetryAt}`,
						service: SERVICE_NAME,
						method: "processRetries",
					});
				}
			}
		}
	};

	retryItem = async (id: string): Promise<DLQItem | null> => {
		const item = await this.dlqRepository.findById(id);
		if (!item) {
			return null;
		}
		try {
			await this.executeRetry(item);
			await this.dlqRepository.deleteById(item.id, item.teamId);
			this.logger.info({
				message: `DLQ item ${id} manually retried successfully, removed`,
				service: SERVICE_NAME,
				method: "retryItem",
			});
			return item;
		} catch (error: unknown) {
			const newRetryCount = item.retryCount + 1;
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			const status = newRetryCount >= item.maxRetries ? "failed" : "retrying";
			const updated = await this.dlqRepository.updateById(id, {
				status,
				retryCount: newRetryCount,
				lastError: errorMessage,
			});
			this.logger.warn({
				message: `DLQ item ${id} manual retry failed: ${errorMessage}`,
				service: SERVICE_NAME,
				method: "retryItem",
			});
			return updated;
		}
	};

	getItems = async (teamId: string, filters: DLQQueryFilters): Promise<{ items: DLQItem[]; count: number }> => {
		const [items, count] = await Promise.all([
			this.dlqRepository.findByTeamId(teamId, filters),
			this.dlqRepository.countByTeamId(teamId),
		]);
		return { items, count };
	};

	getSummary = async (teamId: string): Promise<DLQStatusCount[]> => {
		return this.dlqRepository.countByTeamIdGrouped(teamId);
	};

	purge = async (id: string, teamId: string): Promise<number> => {
		return this.dlqRepository.deleteById(id, teamId);
	};

	cleanup = async (ttlDays: number): Promise<number> => {
		const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
		const deleted = await this.dlqRepository.deleteOlderThan(cutoff);
		if (deleted > 0) {
			this.logger.info({
				message: `DLQ cleanup: deleted ${deleted} items older than ${ttlDays} days`,
				service: SERVICE_NAME,
				method: "cleanup",
			});
		}
		return deleted;
	};

	private executeRetry = async (item: DLQItem): Promise<void> => {
		const payload = item.payload;

		switch (item.type) {
			case "notification": {
				const monitor = payload.monitor as Parameters<INotificationsService["handleNotifications"]>[0];
				const monitorStatusResponse = payload.monitorStatusResponse as Parameters<INotificationsService["handleNotifications"]>[1];
				const decision = payload.decision as Parameters<INotificationsService["handleNotifications"]>[2];

				// Staleness check: skip "down" notifications if monitor has recovered
				const itemAge = Date.now() - new Date(item.createdAt).getTime();
				if (itemAge > STALENESS_THRESHOLD_MS) {
					try {
						const currentMonitor = await this.monitorsRepository.findById(monitor.id, monitor.teamId);
						if (currentMonitor.status === "up" && decision.notificationReason === "status_change") {
							this.logger.info({
								message: `DLQ item ${item.id} skipped: monitor ${monitor.id} has recovered`,
								service: SERVICE_NAME,
								method: "executeRetry",
							});
							return;
						}
					} catch {
						// Monitor may have been deleted — skip the notification
						this.logger.warn({
							message: `DLQ item ${item.id} skipped: monitor ${monitor.id} not found`,
							service: SERVICE_NAME,
							method: "executeRetry",
						});
						return;
					}
				}

				await this.notificationsService.handleNotifications(monitor, monitorStatusResponse, decision);
				break;
			}
			case "incident_create":
			case "incident_resolve": {
				const monitor = payload.monitor as Parameters<IIncidentService["handleIncident"]>[0];
				const code = payload.code as number;
				const decision = payload.decision as Parameters<IIncidentService["handleIncident"]>[2];
				const monitorStatusResponse = payload.monitorStatusResponse as Parameters<IIncidentService["handleIncident"]>[3];

				await this.incidentService.handleIncident(monitor, code, decision, monitorStatusResponse);
				break;
			}
		}
	};
}
