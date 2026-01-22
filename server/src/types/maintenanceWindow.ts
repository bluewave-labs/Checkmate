export interface MaintenanceWindow {
	id: string;
	monitorId: String;
	teamId: string;
	active: boolean;
	name: string;
	repeat: number;
	start: string;
	end: string;
	createdAt: string;
	updatedAt: string;
}
