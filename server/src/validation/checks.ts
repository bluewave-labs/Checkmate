import { z } from "zod";
import mongoose from "mongoose";
import { MonitorStatuses } from "@/types/domain/index.js";

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
