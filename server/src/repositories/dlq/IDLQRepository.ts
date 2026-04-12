import type { DLQItem, DLQItemType, DLQItemStatus } from "@/types/index.js";

export interface DLQQueryFilters {
	type?: DLQItemType;
	status?: DLQItemStatus;
	page: number;
	rowsPerPage: number;
}

export interface DLQStatusCount {
	status: DLQItemStatus;
	type: DLQItemType;
	count: number;
}

export interface IDLQRepository {
	// create
	create(item: Partial<DLQItem>): Promise<DLQItem>;
	// fetch
	findById(id: string): Promise<DLQItem | null>;
	findByTeamId(teamId: string, filters: DLQQueryFilters): Promise<DLQItem[]>;
	findRetryable(limit: number): Promise<DLQItem[]>;
	countByTeamId(teamId: string): Promise<number>;
	countByTeamIdGrouped(teamId: string): Promise<DLQStatusCount[]>;
	// update
	updateById(id: string, patch: Partial<DLQItem>): Promise<DLQItem>;
	// delete
	deleteById(id: string, teamId: string): Promise<number>;
	deleteOlderThan(date: Date): Promise<number>;
}
