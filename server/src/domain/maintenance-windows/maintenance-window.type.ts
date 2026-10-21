import type { z } from "zod";
import type { maintenanceWindowSchema } from "@/domain/maintenance-windows/maintenance-window.schema.js";
export const DurationUnits = ["seconds", "minutes", "hours", "days"] as const;
export type DurationUnit = (typeof DurationUnits)[number];

export type MaintenanceWindow = z.infer<typeof maintenanceWindowSchema>;
