import type { MaintenanceWindow } from "@/domain/maintenance-windows/maintenance-window.type.js";
export interface IMaintenanceWindowsRepository {
	// create
	create(data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow>;
	// fetch
	findById(id: string, teamId: string): Promise<MaintenanceWindow>;
	// Windows that cover a monitor either directly (monitorIds) or through one of the monitor's tags (tagIds)
	findByMonitorId(monitorId: string, teamId: string, tagIds?: string[]): Promise<MaintenanceWindow[]>;
	findByMonitorIds(monitorIds: string[], teamId: string, excludeId?: string, tagIds?: string[]): Promise<MaintenanceWindow[]>;
	findByTeamId(teamId: string, page: number, rowsPerPage: number, field?: string, order?: string, active?: boolean): Promise<MaintenanceWindow[]>;

	// update
	updateById(id: string, teamId: string, data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow>;
	// delete
	deleteById(id: string, teamId: string): Promise<MaintenanceWindow>;
	// other
	countByTeamId(teamId: string, active?: boolean): Promise<number>;
	removeTagFromWindows(tagId: string): Promise<void>;
}
