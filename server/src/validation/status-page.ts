import { z } from "zod";

export const statusPageSchema = z.object({
  name: z.string().min(1, "Status page name is required"),
  url: z.string().min(1, "Status page URL is required"),
  description: z.string().optional(),
  isPublished: z.boolean(),
  monitors: z.array(z.string()).optional().default([]),
});

export const statusPageQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val, ctx) => {
      const num = Number(val);
      if (!val) return;
      if (Number.isNaN(num)) {
        ctx.addIssue({ code: "custom", message: "page must be a number" });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({ code: "custom", message: "page must greater than 0" });
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
        ctx.addIssue({ code: "custom", message: "rowsPerPage must be a number" });
        return z.NEVER;
      }
      if (num < 0) {
        ctx.addIssue({ code: "custom", message: "rowsPerPage must be greater than 0" });
        return z.NEVER;
      }
      if (num > 100) {
        ctx.addIssue({ code: "custom", message: "rowsPerPage must be less than or equal to 100" });
        return z.NEVER;
      }
      return num;
    }),
});

