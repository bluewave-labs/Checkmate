import { z } from "zod";

export const tagSchema = z
	.object({
		id: z.string(),
		teamId: z.string(),
		name: z.string(),
		color: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "Tag" });
