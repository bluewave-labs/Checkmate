import { z } from "zod";
import { MaintenanceRepeats } from "@/types/maintenance";

export const maintenanceSchema = z
  .object({
    name: z.string().min(1, "Maintenance name is required"),
    repeat: z.enum(MaintenanceRepeats),
    startTime: z.date(),
    endTime: z.date(),
    monitors: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time",
      });
    }

    if (data.startTime === data.endTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Start time and end time cannot be the same",
      });
    }
  });

