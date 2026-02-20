import { z } from "zod";
import { registerSchema } from "@/Validation/register";
import { UserRoles } from "@/Types/User";

export const addTeamMemberSchema = registerSchema.extend({
	role: z.array(z.enum(UserRoles)).min(1, "Please select a role"),
});

export type AddTeamMemberFormData = z.infer<typeof addTeamMemberSchema>;
