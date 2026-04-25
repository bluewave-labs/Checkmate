import "./registry.js";
import { z } from "zod";

export const successEnvelope = <T extends z.ZodTypeAny>(data: T) =>
	z.object({
		success: z.literal(true),
		msg: z.string(),
		data,
	});

export const successEnvelopeNoData = z.object({
	success: z.literal(true),
	msg: z.string(),
});

export const errorEnvelope = z.object({
	success: z.literal(false),
	msg: z.string(),
	data: z.unknown().optional(),
});

export const bearer = [{ bearerAuth: [] }];

export const json = <T extends z.ZodTypeAny>(schema: T) => ({
	"application/json": { schema },
});

export const standardErrors = {
	"401": { description: "Unauthorized", content: json(errorEnvelope) },
	"403": { description: "Forbidden", content: json(errorEnvelope) },
	"500": { description: "Internal server error", content: json(errorEnvelope) },
};

export const okJson = <T extends z.ZodTypeAny>(data: T, description = "OK") => ({
	description,
	content: json(successEnvelope(data)),
});

export const okJsonNoData = (description = "OK") => ({
	description,
	content: json(successEnvelopeNoData),
});

export const okUnknown = okJson(z.unknown());

export const multipart = (fields: Record<string, z.ZodTypeAny>, fileField?: string) => {
	const shape: Record<string, z.ZodTypeAny> = { ...fields };
	if (fileField) {
		shape[fileField] = z.string().openapi({ type: "string", format: "binary" });
	}
	return {
		"multipart/form-data": { schema: z.object(shape) },
	};
};
