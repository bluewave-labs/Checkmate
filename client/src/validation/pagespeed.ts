import { z } from "zod";
import { urlRegex, durationSchema } from "@/validation/utils";

export const monitorSchemaPageSpeed = z.object({
  type: z.string().min(1, "You must select an option"),
  url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
  n: z.coerce
    .number({ message: "Number required" })
    .min(1, "Minimum value is 1")
    .max(25, "Maximum value is 25"),
  notificationChannels: z.array(z.string()).optional().default([]),
  name: z.string().min(1, "Display name is required"),
  interval: durationSchema(180000),
  rejectUnauthorized: z.boolean().default(true),
});
