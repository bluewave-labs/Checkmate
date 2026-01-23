import type { Check } from "@/Types/Check";
export type MonitorStatus = "up" | "down" | "initializing";

export interface Monitor {
	checks: Check[];
	createdAt: string;
	createdBy: string;
	interval: number;
	isActive: boolean;
	latestChecks: Check[];
	n: number;
	name: string;
	status: MonitorStatus;
	type: string;
	updatedAt: string;
	updatedBy: string;
	url: string;
	__v: number;
	_id: string;
}
