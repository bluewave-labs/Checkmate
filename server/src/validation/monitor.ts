import { z } from "zod";
import { MonitorTypes } from "@/types/domain/index.js";
import { urlRegex } from "./common.js";

export const monitorSchema = z
  .object({
    type: z.enum(MonitorTypes),
    url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
    name: z.string().min(1, "Display name is required"),
    port: z.coerce.number().optional(),
    n: z
      .number({ message: "Number required" })
      .min(1, "Minimum value is 1")
      .max(25, "Maximum value is 25"),
    notificationChannels: z.array(z.string()).optional().default([]),
    secret: z.string().optional(),
    interval: z.number({ message: "Interval required" }),
    rejectUnauthorized: z.boolean().default(true),
    thresholds: z
      .object({
        cpu: z.number().min(0).max(100).optional(),
        memory: z.number().min(0).max(100).optional(),
        disk: z.number().min(0).max(100).optional(),
        temperature: z.number().min(-50).max(150).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const minIntervals: Record<string, number> = {
      http: 10000,
      https: 10000,
      ping: 10000,
      pagespeed: 100000,
      infrastructure: 60000,
      docker: 60000,
    };

    const minInterval = minIntervals[data.type];
    if (minInterval && data.interval < minInterval) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum interval for ${data.type} monitors is ${minInterval} ms`,
      });
    }

    if (
      (data.type === "infrastructure" || data.type === "docker") &&
      !data.secret
    ) {
      ctx.addIssue({
        code: "custom",
        message: `Secret is required for ${data.type} monitors`,
      });
    }

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

export const monitorImportSchema = z.object({
  monitors: z
    .array(
      z
        .object({
          name: z.string().trim().min(1, "Monitor name is required"),
          url: z.string().trim().regex(urlRegex, "Invalid URL"),
          port: z.number().min(1).max(65535).optional(),
          secret: z.string().trim().optional(),
          type: z.enum(MonitorTypes),
          interval: z.number().min(1, "Interval must be greater than 0"),
          n: z.number().min(1, "n must be at least 1"),
        })
        .strict()
    )
    .min(1, { message: "Provide at least one monitor" }),
});

export type MonitorImportPayload = z.infer<typeof monitorImportSchema>;

export const monitorPatchSchema = monitorSchema
  .omit({ url: true })
  .partial()
  .superRefine((data, ctx) => {
    const minIntervals: Record<string, number> = {
      http: 10000,
      https: 10000,
      ping: 10000,
      pagespeed: 180000,
      infrastructure: 60000,
      docker: 60000,
    };

    if (!data.type || !data.interval) return;

    const minInterval = minIntervals[data.type];
    if (minInterval && data.interval < minInterval) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum interval for ${data.type} monitors is ${minInterval} ms`,
      });
    }
  });
