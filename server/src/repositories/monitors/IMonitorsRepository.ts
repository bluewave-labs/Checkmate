import { type MonitorType, type Monitor } from "@/types/index.js";

export interface TeamQueryConfig {
	limit?: number;
	type?: MonitorType | MonitorType[];
	page?: number;
	rowsPerPage?: number;
	filter?: string;
	field?: string;
	order?: "asc" | "desc";
}

export interface IMonitorsRepository {
	// create
	// single fetch
	// collection fetch
	findAll(): Promise<Monitor[] | null>;
	findByTeamId(teamId: string, config: TeamQueryConfig): Promise<Monitor[] | null>;
	// update
	// delete

	// counts
	findMonitorCountByTeamIdAndType(teamId: string, config: TeamQueryConfig): Promise<number>;
}
