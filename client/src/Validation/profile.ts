import { z } from "zod";

const NAME_PATTERN = /^[A-Za-z'-]+$/;

export const profileSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "First name must be 50 characters or less")
		.regex(NAME_PATTERN, "First name can only contain letters, hyphens, and apostrophes"),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Last name must be 50 characters or less")
		.regex(NAME_PATTERN, "Last name can only contain letters, hyphens, and apostrophes"),
	profileImage: z.instanceof(File).optional().nullable(),
	deleteProfileImage: z.boolean().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
