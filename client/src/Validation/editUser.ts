import { z } from "zod";
import { namePattern } from "@/Validation/patterns";
import { UserRoles } from "@/Types/User";

export const editUserSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name must be 50 characters or less")
		.regex(namePattern, "First name contains invalid characters"),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name must be 50 characters or less")
		.regex(namePattern, "Last name contains invalid characters"),
	role: z.array(z.enum(UserRoles)).min(1, "At least one role is required"),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
