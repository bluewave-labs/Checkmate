import { z } from "zod";
import { UserRoles } from "@/Types/User";

export const inviteSchema = z.object({
	email: z.email("Please enter a valid email address"),
	role: z.array(z.enum(UserRoles)).min(1, "Please select a role"),
});

export type InviteFormData = z.infer<typeof inviteSchema>;
