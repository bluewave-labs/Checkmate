import type { MaintenanceWindow } from "@/types/index.js";
export interface IMaintenanceWindowsRepository {
	// create
	create(data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow>;
	// fetch
	findById(id: string, teamId: string): Promise<MaintenanceWindow>;
	findRelated(maintenanceWindow: MaintenanceWindow): Promise<MaintenanceWindow[]>;
	findByMonitorId(monitorId: string, teamId: string): Promise<MaintenanceWindow[]>;
	findByTeamId(teamId: string, page: number, rowsPerPage: number, field?: string, order?: string, active?: boolean): Promise<MaintenanceWindow[]>;

	// update
	updateById(id: string, teamId: string, data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow>;
	// delete
	deleteById(id: string, teamId: string): Promise<MaintenanceWindow>;
	// other
	countByTeamId(teamId: string, active?: boolean): Promise<number>;
}
