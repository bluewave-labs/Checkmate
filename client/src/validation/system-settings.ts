import { z } from "zod";
import { optionalString } from "@/validation/utils";

export const systemSettingsSchema = z.object({
  systemEmailHost: optionalString(
    z.string().trim().min(1, { message: "SMTP host is required" }).max(255, {
      message: "SMTP host must be 255 characters or fewer",
    })
  ),
  systemEmailPort: optionalString(
    z
      .union([z.number().int(), z.string().regex(/^\d+$/)])
      .transform((val) => (typeof val === "string" ? Number(val) : val))
      .refine(
        (val) =>
          val === undefined ||
          (Number.isInteger(val) && val > 0 && val < 65536),
        {
          message: "Port must be a number between 1 and 65535",
        }
      )
  ),
  systemEmailAddress: optionalString(
    z.string().email({ message: "SMTP email must be valid" })
  ),
  systemEmailPassword: optionalString(
    z.string().max(255, {
      message: "SMTP password must be 255 characters or fewer",
    })
  ),
  systemEmailUser: optionalString(
    z.string().trim().max(255, {
      message: "SMTP username must be 255 characters or fewer",
    })
  ),
  systemEmailConnectionHost: optionalString(
    z.string().trim().max(255, {
      message: "Connection host must be 255 characters or fewer",
    })
  ),
  systemEmailTLSServername: optionalString(
    z.string().trim().max(255, {
      message: "TLS server name must be 255 characters or fewer",
    })
  ),
  systemEmailSecure: z.boolean().optional(),
  systemEmailPool: z.boolean().optional(),
  systemEmailIgnoreTLS: z.boolean().optional(),
  systemEmailRequireTLS: z.boolean().optional(),
  systemEmailRejectUnauthorized: z.boolean().optional(),
  checksRetentionDays: z.coerce
    .number({ message: "Number required" })
    .min(1, "Retention days must be at least 1")
    .max(365, "Retention days cannot exceed 365 days"),
});
