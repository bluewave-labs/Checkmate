import { z } from "zod";

export const tagSchema = z.object({
	name: z.string().min(1, "Please enter a tag name"),
	color: z
		.string()
		.regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex value (e.g. #13715B)"),
});

export type TagFormData = z.infer<typeof tagSchema>;
