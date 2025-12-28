import { z } from "zod";
import humanInterval from "human-interval";
import ms from "ms";
export const urlRegex =
  /^(https?:\/\/)?(localhost|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|[a-zA-Z0-9-]+|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

export const durationSchema = (minInterval: number) =>
  z.string().superRefine((val, ctx) => {
    const milis = humanInterval(val);

    if (!milis || isNaN(milis)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid duration format",
      });
    } else if (milis < minInterval) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum duration is ${ms(minInterval, { long: true })}`,
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
