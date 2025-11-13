import {
  ChannelTypes,
  MonitorStatuses,
  ResolutionTypes,
} from "@/db/models/index.js";
import { z } from "zod";
import mongoose from "mongoose";

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  firstName: z.string().min(1, { message: "First Name is required" }),
  lastName: z.string().min(1, { message: "Last Name is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const registerWithInviteSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First Name is required" })
    .optional(),
  lastName: z.string().min(1, { message: "Last Name is required" }).optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .optional(),
  confirmPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const inviteSchema = z.object({
  email: z.email("Invalid email address"),
  teamId: z.string().min(1, "Team is required"),
  teamRoleId: z.string().min(1, "Role is required"),
  orgRoleId: z.string().optional(),
});

const urlRegex =
  /^(https?:\/\/)?(localhost|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/.*)?$/;

export const monitorSchema = z
  .object({
    type: z.string().min(1, "You must select an option"),
    url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
    name: z.string().min(1, "Display name is required"),
    n: z
      .number({ message: "Number required" })
      .min(1, "Minimum value is 1")
      .max(25, "Maximum value is 25"),
    notificationChannels: z.array(z.string()).optional().default([]),
    secret: z.string().optional(),
    interval: z.number({ message: "Interval required" }),
  })
  .superRefine((data, ctx) => {
    const minIntervals: Record<string, number> = {
      http: 10000,
      ping: 10000,
      pagespeed: 100000,
    };

    const minInterval = minIntervals[data.type];
    if (minInterval && data.interval < minInterval) {
      ctx.addIssue({
        code: "custom",
        message: `Minimum interval for ${data.type} monitors is ${minInterval} ms`,
      });
    }

    if (data.type === "infrastructure" && !data.secret) {
      ctx.addIssue({
        code: "custom",
        message: `Secret is required for infrastructure monitors`,
      });
    }
  });

export const monitorPatchSchema = monitorSchema
  .omit({
    url: true,
  })
  .partial()
  .superRefine((data, ctx) => {
    const minIntervals: Record<string, number> = {
      http: 10000,
      https: 10000,
      ping: 10000,
      pagespeed: 180000,
      infrastructure: 60000,
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

export const monitorAllEmbedChecksQuerySchema = z.object({
  embedChecks: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      ctx.addIssue({
        code: "custom",
        message: "embedChecks must be 'true' or 'false'",
      });
      return z.NEVER;
    }),
  type: z
    .union([z.string().optional(), z.string().optional().array()])
    .optional()
    .transform((val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    }),
  page: z
    .string()
    .optional()
    .transform((val, ctx) => {
      const num = Number(val);
      if (!val) return;
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          message: "page must be a number",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: "custom",
          message: "page must greater than 0",
        });
        return z.NEVER;
      }
      return num;
    }),
  rowsPerPage: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return;
      const num = Number(val);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be a number",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be greater than 0",
        });
        return z.NEVER;
      }
      if (num > 100) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be less than or equal to 100",
        });
        return z.NEVER;
      }
      return num;
    }),
});

export const monitorIdChecksQuerySchema = z.object({
  page: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "page must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "page must greater than 0",
      });
      return z.NEVER;
    }
    return num;
  }),
  rowsPerPage: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be greater than 0",
      });
      return z.NEVER;
    }
    if (num > 100) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be less than or equal to 100",
      });
      return z.NEVER;
    }
    return num;
  }),
});

export const monitorIdQuerySchema = z.object({
  embedChecks: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  range: z.string().optional(),
  status: z.string().optional(),
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
export const notificationPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(ChannelTypes).optional(),
    config: z
      .object({
        url: z
          .string()
          .regex(urlRegex, "Invalid URL")
          .or(z.literal(""))
          .optional(),
        emailAddress: z
          .string()
          .email("Invalid email address")
          .or(z.literal(""))
          .optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const { type, config } = data;

    if (!config) return;

    const hasUrl = config.url !== undefined && config.url !== "";
    const hasEmail =
      config.emailAddress !== undefined && config.emailAddress !== "";

    if (!hasUrl && !hasEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Either a URL or an email address must be provided.",
        path: ["config"],
      });
    }

    if (hasUrl && hasEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot provide both URL and email address at the same time.",
        path: ["config"],
      });
    }

    if (type === "email" && !hasEmail) {
      ctx.addIssue({
        code: "custom",
        message: "Email address is required for email-type channels.",
        path: ["config", "emailAddress"],
      });
    } else if (type && type !== "email" && !hasUrl) {
      ctx.addIssue({
        code: "custom",
        message: "URL is required for non-email-type channels.",
        path: ["config", "url"],
      });
    }
  });

export const checksStatusIdQuerySchema = z.object({
  status: z.enum(MonitorStatuses, { error: "Invalid status" }),
  monitorId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid MongoDB ObjectId",
    })
    .optional(),
  page: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "page must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "page must greater than 0",
      });
      return z.NEVER;
    }
    return num;
  }),
  rowsPerPage: z.string().transform((val, ctx) => {
    const num = Number(val);
    if (Number.isNaN(num)) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be a number",
      });
      return z.NEVER;
    }
    if (num < 0) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be greater than 0",
      });
      return z.NEVER;
    }
    if (num > 100) {
      ctx.addIssue({
        code: "custom",
        message: "rowsPerPage must be less than or equal to 100",
      });
      return z.NEVER;
    }
    return num;
  }),
  range: z.string().min(1),
});

export const statusPageSchema = z.object({
  name: z.string().min(1, "Status page name is required"),
  url: z.string().min(1, "Status page URL is required"),
  description: z.string().optional(),
  isPublished: z.boolean(),
  monitors: z.array(z.string()).optional().default([]),
});

export const recoverySchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
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

export const getIncidentsQuerySchema = z.object({
  resolutionType: z.enum(ResolutionTypes).optional(),
  resolved: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      ctx.addIssue({
        code: "custom",
        message: "resolved must be 'true' or 'false'",
      });
      return z.NEVER;
    }),
  page: z
    .string()
    .optional()
    .transform((val, ctx) => {
      const num = Number(val);
      if (!val) return;
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          message: "page must be a number",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: "custom",
          message: "page must greater than 0",
        });
        return z.NEVER;
      }
      return num;
    }),
  rowsPerPage: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return;
      const num = Number(val);
      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be a number",
        });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be greater than 0",
        });
        return z.NEVER;
      }
      if (num > 100) {
        ctx.addIssue({
          code: "custom",
          message: "rowsPerPage must be less than or equal to 100",
        });
        return z.NEVER;
      }
      return num;
    }),
  range: z.string().optional(),
  monitorId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid MongoDB ObjectId",
    })
    .optional(),
});

export const patchIncidentsBodySchema = z.object({
  resolutionNote: z.string().max(200).optional(),
});
