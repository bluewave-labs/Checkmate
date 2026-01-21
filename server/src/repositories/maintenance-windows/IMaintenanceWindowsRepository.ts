import type { MaintenanceWindow } from "@/types/index.js";
export interface IMaintenanceWindowsRepository {
	// create
	create(data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow>;
	// fetch
	findById(id: string, teamId: string): Promise<MaintenanceWindow>;

	findByTeamId(teamId: string, active: boolean, page: number, rowsPerPage: number, field: string, order: string): Promise<MaintenanceWindow[]>;

	// update
	// delete
	// other
	countByTeamId(teamId: string, active: boolean): Promise<number>;
}
