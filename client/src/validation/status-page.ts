import { z } from "zod";

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
