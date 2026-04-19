export type DurationUnit = "seconds" | "minutes" | "hours" | "days";

export interface MaintenanceWindow {
	id: string;
	monitorId: string;
	teamId: string;
	active: boolean;
	name: string;
	duration: number;
	durationUnit: DurationUnit;
	repeat: number;
	start: string;
	end: string;
	createdAt: string;
	updatedAt: string;
}

export interface GroupedMaintenanceWindows {
	id: string;
	name: string;
	start: string;
	end: string;
	repeat: number;
	active: boolean;
	monitors: MaintenanceWindow[];
}