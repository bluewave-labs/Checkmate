import { z } from "zod";

export const systemSettingsSchema = z
  .object({
    systemEmailHost: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().trim().min(1).max(255).optional()
    ),
    systemEmailPort: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z
        .union([z.number().int(), z.string().regex(/^\d+$/)])
        .transform((port) => (typeof port === "string" ? Number(port) : port))
        .refine(
          (port) =>
            port === undefined ||
            (Number.isInteger(port) && port > 0 && port < 65536),
          {
            message: "Port must be between 1 and 65535",
          }
        )
        .optional()
    ),
    systemEmailAddress: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().email().optional()
    ),
    systemEmailPassword: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().trim().max(255).optional()
    ),
    systemEmailUser: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().trim().max(255).optional()
    ),
    systemEmailConnectionHost: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().trim().max(255).optional()
    ),
    systemEmailTLSServername: z.preprocess(
      (val) => (val === "" || val === null ? undefined : val),
      z.string().trim().max(255).optional()
    ),
    systemEmailSecure: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => (typeof val === "string" ? val === "true" : val)),
    systemEmailPool: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => (typeof val === "string" ? val === "true" : val)),
    systemEmailIgnoreTLS: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => (typeof val === "string" ? val === "true" : val)),
    systemEmailRequireTLS: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => (typeof val === "string" ? val === "true" : val)),
    systemEmailRejectUnauthorized: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => (typeof val === "string" ? val === "true" : val)),
  })
  .strip();

export const updateRetentionPolicySchema = z.object({
  checksRetentionDays: z
    .number()
    .min(1, "Retention days must be at least 1")
    .max(365, "Retention days cannot exceed 365 days"),
});

