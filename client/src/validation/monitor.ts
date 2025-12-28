import { z } from "zod";
import humanInterval from "human-interval";
const urlRegex =
  /^(https?:\/\/)?(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|[a-zA-Z0-9-]+|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

const durationSchema = z.string().superRefine((val, ctx) => {
  // if (!val || val.trim() === "") return;
  const ms = humanInterval(val);

  if (!ms || isNaN(ms)) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid duration format",
    });
  } else if (ms < 10000) {
    ctx.addIssue({
      code: "custom",
      message: "Minimum duration is 10 seconds",
    });
  }
});

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
    interval: durationSchema,
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
