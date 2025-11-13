import { z } from "zod";
import humanInterval from "human-interval";
import { ChannelTypes } from "@/types/notification-channel";
import { MaintenanceRepeats } from "@/types/maintenance";

export const registerSchema = z
  .object({
    email: z.email({ message: "Invalid email address" }),
    firstName: z.string().min(1, { message: "First Name is required" }),
    lastName: z.string().min(1, { message: "Last Name is required" }),
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

const urlRegex =
  /^(https?:\/\/)?(localhost|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

const durationSchema = z
  .string()
  .optional()
  .superRefine((val, ctx) => {
    if (!val || val.trim() === "") return;
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
const durationSchemaPageSpeed = z
  .string()
  .optional()
  .superRefine((val, ctx) => {
    if (!val || val.trim() === "") return;
    const ms = humanInterval(val);

    if (!ms || isNaN(ms)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid duration format",
      });
    } else if (ms < 180000) {
      ctx.addIssue({
        code: "custom",
        message: "Minimum duration is 3 minutes",
      });
    }
  });
const durationSchemaInfra = z
  .string()
  .optional()
  .superRefine((val, ctx) => {
    if (!val || val.trim() === "") return;
    const ms = humanInterval(val);

    if (!ms || isNaN(ms)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid duration format",
      });
    } else if (ms < 60000) {
      ctx.addIssue({
        code: "custom",
        message: "Minimum duration is 1 minute",
      });
    }
  });

export const monitorSchema = z.object({
  type: z.string().min(1, "You must select an option"),
  url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
  n: z.coerce
    .number({ message: "Number required" })
    .min(1, "Minimum value is 1")
    .max(25, "Maximum value is 25"),
  notificationChannels: z.array(z.string()).optional().default([]),
  name: z.string().min(1, "Display name is required"),
  interval: durationSchema,
});

export const monitorSchemaPageSpeed = z.object({
  type: z.string().min(1, "You must select an option"),
  url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
  n: z.coerce
    .number({ message: "Number required" })
    .min(1, "Minimum value is 1")
    .max(25, "Maximum value is 25"),
  notificationChannels: z.array(z.string()).optional().default([]),
  name: z.string().min(1, "Display name is required"),
  interval: durationSchemaPageSpeed,
});
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
  interval: durationSchemaInfra,
});

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

export const notificationChannelSchema = z
  .object({
    name: z.string().min(1, "Channel name is required"),
    type: z.enum(ChannelTypes, { error: "Invalid channel type" }),
    config: z.object({
      url: z
        .string()
        .regex(urlRegex, "Invalid URL")
        .or(z.literal(""))
        .optional(),
      emailAddress: z
        .email("Invalid email address")
        .or(z.literal(""))
        .optional(),
    }),
  })
  .superRefine((data, ctx) => {
    const { type, config } = data;
    if (!config.url && !config.emailAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Either a URL or an email address must be provided.",
        path: ["config"],
      });
    }

    if (type === "email" && !config.emailAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Email address is required for email-type channels.",
        path: ["config", "emailAddress"],
      });
    } else if (type !== "email" && !config.url) {
      ctx.addIssue({
        code: "custom",
        message: "URL is required for non-email-type channels.",
        path: ["config", "url"],
      });
    }
  });

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
