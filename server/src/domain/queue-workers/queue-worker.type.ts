import type { z } from "zod";
import type { queueWorkerSchema, workerEgressSchema } from "@/domain/queue-workers/queue-worker.schema.js";

export type QueueWorker = z.infer<typeof queueWorkerSchema>;
export type WorkerEgress = z.infer<typeof workerEgressSchema>;
