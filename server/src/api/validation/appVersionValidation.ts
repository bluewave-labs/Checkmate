import { z } from "zod";

export const appVersionResponseSchema = z
	.object({
		current: z.string(),
		latest: z.string().nullable(),
		updateAvailable: z.boolean(),
		releaseUrl: z.string().nullable(),
	})
	.meta({ id: "AppVersion" });
