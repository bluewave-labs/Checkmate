import { z } from "zod";
import { urlRegex, durationSchema } from "@/validation/utils";

export const monitorSchema = z
  .object({
    type: z.string().min(1, "You must select an option"),
    url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
    n: z.coerce
      .number({ message: "Number required" })
      .min(1, "Minimum value is 1")
      .max(25, "Maximum value is 25"),
    port: z.coerce.number().optional(),
    notificationChannels: z.array(z.string()).optional().default([]),
    name: z.string().min(1, "Display name is required"),
    interval: durationSchema(10000),
    rejectUnauthorized: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === "port") {
      if (!data.port) {
        ctx.addIssue({
          code: "custom",
          message: "Port is required for port monitoring",
          path: ["port"],
        });
      }
      if (isNaN(Number(data.port))) {
        ctx.addIssue({
          code: "custom",
          message: "Port must be a number",
          path: ["port"],
        });
      }
      if (Number(data.port) < 1 || Number(data.port) > 65535) {
        ctx.addIssue({
          code: "custom",
          message: "Port must be between 1 and 65535",
          path: ["port"],
        });
      }
    }
  });
