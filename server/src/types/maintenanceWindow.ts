export type DurationUnit = "seconds" | "minutes" | "hours" | "days";

export interface MaintenanceWindow {
	id: string;
	monitorId: String;
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
