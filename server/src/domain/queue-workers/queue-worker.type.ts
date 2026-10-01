import type { z } from "zod";
import type { queueWorkerSchema } from "@/domain/queue-workers/queue-worker.schema.js";

export type QueueWorker = z.infer<typeof queueWorkerSchema>;
