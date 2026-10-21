import { z } from "zod";
import { workerJobsPageSchema, workerMetricsSchema } from "@/worker/worker.schema.js";

export const getQueueJobsQueryValidation = z.object({
	page: z.coerce.number().int().min(0).optional(),
	rowsPerPage: z.coerce.number().int().min(1).max(100).optional(),
});

export const queueAllMetricsResponseSchema = workerJobsPageSchema.extend({ metrics: workerMetricsSchema });
