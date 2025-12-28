import { z } from "zod";
import { urlRegex, durationSchema } from "@/validation/utils";

export const monitorSchemaInfra = z.object({
  type: z.string().min(1, "You must select an option"),
  url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
  secret: z.string().min(1, "Secret is required"),
  n: z.coerce
    .number({ message: "Number required" })
    .min(1, "Minimum value is 1")
    .max(25, "Maximum value is 25"),
  notificationChannels: z.array(z.string()).optional().default([]),
  name: z.string().min(1, "Display name is required"),
  interval: durationSchema(60000),
  rejectUnauthorized: z.boolean().default(true),
  thresholds: z.object({
    cpu: z.preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z
        .string()
        .trim()
        .min(1, { message: "CPU threshold is required" })
        .refine((v) => /^-?\d+(\.\d+)?$/.test(v), {
          message: "CPU must be a number",
        })
        .transform((v) => Number(v))
        .refine((v) => v >= 0 && v <= 100, {
          message: "CPU must be between 0 and 100",
        })
    ),
    memory: z.preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z
        .string()
        .trim()
        .min(1, { message: "Memory threshold is required" })
        .refine((v) => /^-?\d+(\.\d+)?$/.test(v), {
          message: "Memory must be a number",
        })
        .transform((v) => Number(v))
        .refine((v) => v >= 0 && v <= 100, {
          message: "Memory must be between 0 and 100",
        })
    ),
    disk: z.preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z
        .string()
        .trim()
        .min(1, { message: "Disk threshold is required" })
        .refine((v) => /^-?\d+(\.\d+)?$/.test(v), {
          message: "Disk must be a number",
        })
        .transform((v) => Number(v))
        .refine((v) => v >= 0 && v <= 100, {
          message: "Disk must be between 0 and 100",
        })
    ),
    temperature: z.preprocess(
      (val) => (typeof val === "number" ? String(val) : val),
      z
        .string()
        .trim()
        .min(1, { message: "Temperature threshold is required" })
        .refine((v) => /^-?\d+(\.\d+)?$/.test(v), {
          message: "Temperature must be a number",
        })
        .transform((v) => Number(v))
        .refine((v) => v >= -50 && v <= 150, {
          message: "Temperature must be between -50 and 150",
        })
    ),
  }),
});
