import { z } from "zod";
import { QueueModes } from "@/domain/app-settings/app-settings.type.js";
import { EgressStatuses } from "@/domain/egress/egress.type.js";
import { egressProbeResultSchema } from "@/domain/egress/egress.schema.js";

export const workerEgressSchema = z.object({
	status: z.enum(EgressStatuses),
	checkedAt: z.number().meta({ description: "Epoch ms of the probe behind this verdict" }),
	degradedSince: z.number().nullable().meta({ description: "Epoch ms the current degraded spell began, null when ok" }),
	lastProbeResults: z.array(egressProbeResultSchema),
});

export const queueWorkerSchema = z
	.object({
		workerId: z.string().meta({ description: "hostname:pid:uuid" }),
		mode: z.enum(QueueModes),
		processesJobs: z.boolean(),
		lastSeenAt: z.number().meta({ description: "Epoch ms of the last heartbeat" }),
		egress: workerEgressSchema.optional(),
	})
	.meta({ id: "QueueWorker" });
