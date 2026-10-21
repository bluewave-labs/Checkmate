import { z } from "zod";
import { UserRoles } from "@/domain/users/user.type.js";

export const inviteSchema = z
	.object({
		id: z.string(),
		email: z.string(),
		teamId: z.string(),
		role: z.array(z.enum(UserRoles)),
		token: z.string(),
		expiry: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "Invite" });
