import { z } from "zod";
import { dockerLogLineSchema } from "./docker.schema.js";

export const dockerLogMetadataSchema = z.object({
	monitorId: z.string(),
	teamId: z.string(),
	containerId: z.string(),
	containerName: z.string(),
});

export const dockerLogSchema = z
	.object({
		id: z.string(),
		metadata: dockerLogMetadataSchema,
		lines: z.array(dockerLogLineSchema),
		gap: z.boolean(),
		checkedAt: z.string(),
		expiry: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "DockerLog" });

export const dockerLogPageSchema = z
	.object({
		logs: z.array(dockerLogSchema),
		nextCursor: z.string().nullable(),
	})
	.meta({ id: "DockerLogPage" });
