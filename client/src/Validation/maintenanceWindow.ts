import { z } from "zod";
import dayjs from "dayjs";

export const repeatOptions = [
	{ id: "none", name: "Don't repeat", value: 0 },
	{ id: "daily", name: "Repeat daily", value: 86400000 },
	{ id: "weekly", name: "Repeat weekly", value: 604800000 },
] as const;

export const durationUnitOptions = [
	{ id: "seconds", name: "seconds", multiplier: 1000 },
	{ id: "minutes", name: "minutes", multiplier: 60000 },
	{ id: "hours", name: "hours", multiplier: 3600000 },
	{ id: "days", name: "days", multiplier: 86400000 },
] as const;

const maintenanceWindowBaseSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be at most 100 characters"),
	repeat: z.string(),
	startDate: z.string().min(1, "Start date is required"),
	startTime: z.string().min(1, "Start time is required"),
	duration: z.number().int().min(1, "Duration must be at least 1"),
	durationUnit: z.string(),
	monitors: z.array(z.string()).min(1, "At least one monitor is required"),
});

export const maintenanceWindowSchema = maintenanceWindowBaseSchema.refine(
	(data) => {
		const startDateTime = dayjs(data.startDate)
			.set("hour", parseInt(data.startTime.split(":")[0], 10))
			.set("minute", parseInt(data.startTime.split(":")[1], 10));
		return startDateTime.isAfter(dayjs());
	},
	{
		message: "Start date and time must be in the future",
		path: ["startDate"],
	}
);

export const maintenanceWindowEditSchema = maintenanceWindowBaseSchema;

export type MaintenanceWindowFormData = z.infer<typeof maintenanceWindowSchema>;
