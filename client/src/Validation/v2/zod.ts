import { z } from "zod";
import humanInterval from "human-interval";
const urlRegex =
	/^(?:https?:\/\/)?([a-zA-Z0-9.-]+|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-fA-F:]+\])(:\d{1,5})?$/;

const durationSchema = z
	.string()
	.optional()
	.superRefine((val, ctx) => {
		if (!val || val.trim() === "") return;
		const ms = humanInterval(val);

		if (!ms || isNaN(ms)) {
			ctx.addIssue({
				code: "custom",
				message: "Invalid duration format",
			});
		} else if (ms < 10000) {
			ctx.addIssue({
				code: "custom",
				message: "Minimum duration is 10 seconds",
			});
		}
	});

export const monitorSchema = z.object({
	type: z.string().min(1, "You must select an option"),
	url: z.string().min(1, "URL is required").regex(urlRegex, "Invalid URL"),
	n: z.coerce
		.number({ message: "Number required" })
		.min(1, "Minimum value is 1")
		.max(25, "Maximum value is 25"),
	notificationChannels: z.array(z.string()).optional().default([]),
	name: z.string().min(1, "Display name is required"),
	interval: durationSchema,
});
