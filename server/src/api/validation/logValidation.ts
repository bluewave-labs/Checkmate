import { z } from "zod";
import { logEntrySchema } from "@/utils/logger.schema.js";

export const logListResponseSchema = z.array(logEntrySchema);
