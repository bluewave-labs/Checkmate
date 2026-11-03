import { z } from "zod";

// Return shape of GET /settings/version
export const appVersionInfoSchema = z
	.object({
		latest: z.string().nullable(), // Latest release tag, null if failed
		updateAvailable: z.boolean(),
	})
	.meta({ id: "AppVersion" });
