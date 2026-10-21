import { z } from "zod";
import { logEntrySchema } from "@/utils/logger/logger.schema.js";

export const logListResponseSchema = z.array(logEntrySchema);
