import { z } from "zod";
import { DurationUnits } from "./maintenance-window.type.js";

export const maintenanceWindowSchema = z
	.object({
		id: z.string(),
		monitorIds: z.array(z.string()),
		teamId: z.string(),
		active: z.boolean(),
		name: z.string(),
		duration: z.number(),
		durationUnit: z.enum(DurationUnits),
		repeat: z.number(),
		start: z.string(),
		end: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "MaintenanceWindow" });
