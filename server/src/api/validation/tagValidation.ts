import { z } from "zod";

//****************************************
// Tag Validations
//****************************************

export const createTagBodyValidation = z.object({
	name: z.string().min(1, "Tag name is required"),
	color: z
		.string()
		.regex(/^#([0-9a-fA-F]{6})$/, "Color must be a 6-digit hex value (e.g. #13715B)")
		.optional(),
});

export const editTagBodyValidation = createTagBodyValidation;

export const getTagByIdParamValidation = z.object({
	id: z.string().min(1, "Tag ID is required"),
});
export const editTagParamValidation = z.object({
	id: z.string().min(1, "Tag ID is required"),
});
export const deleteTagParamValidation = z.object({
	id: z.string().min(1, "Tag ID is required"),
});
