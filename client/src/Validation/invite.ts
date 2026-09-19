import { z } from "zod";
import { UserRoles } from "@/Types/User";
import {
	MIN_INVITE_DURATION_HOURS,
	MAX_INVITE_DURATION_HOURS,
} from "@/Utils/inviteDurationOptions";

export const inviteSchema = z.object({
	email: z.email("Please enter a valid email address"),
	role: z.array(z.enum(UserRoles)).min(1, "Please select a role"),
	expiresInHours: z
		.number()
		.int("Expiry duration must be a whole number of hours")
		.min(MIN_INVITE_DURATION_HOURS, "Please select how long the invite should stay valid")
		.max(
			MAX_INVITE_DURATION_HOURS,
			"Please select how long the invite should stay valid"
		),
});

export type InviteFormData = z.infer<typeof inviteSchema>;
