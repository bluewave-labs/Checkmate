export const DurationUnits = ["seconds", "minutes", "hours", "days"] as const;
export type DurationUnit = (typeof DurationUnits)[number];

export interface MaintenanceWindow {
	id: string;
	groupId?: string;
	monitorId: string;
	monitors?: string[];
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
