export type DurationUnit = "seconds" | "minutes" | "hours" | "days";

export interface MaintenanceWindow {
	id: string;
	monitorIds: string[];
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
