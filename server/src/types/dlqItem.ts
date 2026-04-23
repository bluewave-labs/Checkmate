export const DLQItemTypes = ["notification", "incident_create", "incident_resolve"] as const;
export type DLQItemType = (typeof DLQItemTypes)[number];

export const DLQItemStatuses = ["pending", "retrying", "failed"] as const;
export type DLQItemStatus = (typeof DLQItemStatuses)[number];

export interface DLQItem {
	id: string;
	type: DLQItemType;
	status: DLQItemStatus;
	payload: Record<string, unknown>;
	monitorId: string;
	teamId: string;
	retryCount: number;
	maxRetries: number;
	lastError: string;
	nextRetryAt: string;
	createdAt: string;
	updatedAt: string;
}
