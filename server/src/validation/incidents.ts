import { z } from "zod";
import mongoose from "mongoose";
import { ResolutionTypes } from "@/types/domain/index.js";

export const getIncidentQuerySchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId",
  }),
});

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
