import { z } from "zod";
import { namePattern } from "@/Validation/patterns";

export const profileSchema = z.object({
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
	profileImage: z.instanceof(File).optional().nullable(),
	deleteProfileImage: z.boolean().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
