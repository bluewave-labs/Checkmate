import { z } from "zod";

export const monitorAllEmbedChecksQuerySchema = z.object({
  embedChecks: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined) return undefined;
      if (val === "true") return true;
      if (val === "false") return false;
      ctx.addIssue({ code: "custom", message: "embedChecks must be 'true' or 'false'" });
      return z.NEVER;
    }),
  type: z
    .union([z.string().optional(), z.string().optional().array()])
    .optional()
    .transform((val) => (!val ? [] : Array.isArray(val) ? val : [val])),
  status: z
    .union([z.string().optional(), z.string().optional().array()])
    .optional()
    .transform((val) => (!val ? [] : Array.isArray(val) ? val : [val])),
  search: z.string().optional(),
  sortField: z.string().optional(),
  sortOrder: z.string().optional(),
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

export const monitorIdChecksQuerySchema = z.object({
  page: z.string().transform((val, ctx) => {
    const num = Number(val);
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
  rowsPerPage: z.string().transform((val, ctx) => {
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

export const monitorIdQuerySchema = z.object({
  embedChecks: z.string().transform((val) => val === "true").optional(),
  range: z.string().optional(),
  status: z.string().optional(),
});

