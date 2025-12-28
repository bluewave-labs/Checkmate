import { z } from "zod";
// humanInterval moved to split schema files
import { MaintenanceRepeats } from "@/types/maintenance";

// urlRegex moved to client/src/validation/utils.ts

// monitor duration schema moved to client/src/validation/monitor.ts
// pagespeed duration schema moved to client/src/validation/pagespeed.ts
// infra duration schema moved to client/src/validation/infra.ts

const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    schema.optional()
  );

// moved to client/src/validation/monitor.ts

// moved to client/src/validation/pagespeed.ts
// moved to client/src/validation/infra.ts

export const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  roleId: z.string().min(1, "Role is required"),
  description: z.string().optional(),
});

export const teamMemberSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
  teamId: z.string().min(1, "Team is required"),
});

export const inviteSchema = z.object({
  email: z.email("Invalid email address"),
  teamId: z.string().min(1, "Team is required"),
  teamRoleId: z.string().min(1, "Role is required"),
  orgRoleId: z.string().optional(),
});

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

const statusPageUrlRegex = /^[A-Za-z0-9]+$/;

export const statusPageSchema = z.object({
  name: z.string().min(1, "Status page name is required"),
  description: z.string().optional(),
  url: z
    .string()
    .min(1, "URL is required")
    .regex(statusPageUrlRegex, "Invalid URL"),
  isPublished: z.boolean().optional(),
  monitors: z.array(z.string()),
});

export const recoverySchema = z.object({
  email: z.email({ message: "Invalid email address" }).trim().toLowerCase(),
});

export const resetSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Confirm Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

export const profileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "First Name must be at least one char" })
      .optional(),
    lastName: z
      .string()
      .min(1, { message: "Last Name must be at least one char" })
      .optional(),
    password: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z
        .string()
        .min(6, { message: "Password must be at least 6 characters" })
        .optional()
    ),
    confirmPassword: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z
        .string()
        .min(6, { message: "Confirm Password must be at least 6 characters" })
        .optional()
    ),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;

      if (!data.password || !data.confirmPassword) return false;

      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords must match",
      path: ["confirmPassword"],
    }
  );
