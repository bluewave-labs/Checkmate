import { z } from "zod";
import { QueueModes } from "@/domain/app-settings/app-settings.type.js";

export const queueWorkerSchema = z
	.object({
		workerId: z.string().meta({ description: "hostname:pid:uuid" }),
		mode: z.enum(QueueModes),
		processesJobs: z.boolean(),
		lastSeenAt: z.number().meta({ description: "Epoch ms of the last heartbeat" }),
	})
	.meta({ id: "QueueWorker" });
