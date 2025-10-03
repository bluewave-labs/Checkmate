import type { Check } from "@/Types/Check";

export interface IMonitor {
	checks: Check[];
	createdAt: string;
	createdBy: string;
	interval: number;
	isActive: boolean;
	latestChecks: Check[];
	n: number;
	name: string;
	status: string;
	type: string;
	updatedAt: string;
	updatedBy: string;
	url: string;
	__v: number;
	_id: string;
}
