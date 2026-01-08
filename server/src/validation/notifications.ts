import { z } from "zod";
import { ChannelTypes } from "@/types/domain/index.js";
import { urlRegex } from "./common.js";

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
