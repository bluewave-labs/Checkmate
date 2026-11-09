import { z } from "zod";

export const connectStatusSchema = z
	.object({
		enrolled: z.boolean(),
		agentId: z.string().nullable(),
		connectUrl: z.string().nullable(),
		apiUrl: z.string().nullable(),
		agentVersion: z.string(),
	})
	.meta({ id: "ConnectStatus" });
