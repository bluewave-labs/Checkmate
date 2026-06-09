import { z } from "zod";

export const getQueueJobsQueryValidation = z.object({
	page: z.coerce.number().int().min(0).optional(),
	rowsPerPage: z.coerce.number().int().min(1).max(100).optional(),
});
