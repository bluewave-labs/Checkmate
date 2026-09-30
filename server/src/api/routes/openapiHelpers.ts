import { z } from "zod";

export const successEnvelope = <T extends z.ZodType>(data: T) =>
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

export const json = <T extends z.ZodType>(schema: T, example?: unknown) => ({
	"application/json": example === undefined ? { schema } : { schema, example },
});

export const errorJson = (description: string) => ({ description, content: json(errorEnvelope) });

export const unknownResponseSchema = z.unknown();

export const standardErrors = {
	"401": { description: "Unauthorized", content: json(errorEnvelope) },
	"403": { description: "Forbidden", content: json(errorEnvelope) },
	"500": { description: "Internal server error", content: json(errorEnvelope) },
};

export const okJson = <T extends z.ZodType>(data: T, description = "OK", example?: unknown) => ({
	description,
	content: json(successEnvelope(data), example === undefined ? undefined : { success: true, msg: "OK", data: example }),
});

export const okJsonNoData = (description = "OK") => ({
	description,
	content: json(successEnvelopeNoData, { success: true, msg: "OK" }),
});

export const multipart = (fields: Record<string, z.ZodType>, fileField?: string) => {
	const shape: Record<string, z.ZodType> = { ...fields };
	if (fileField) {
		shape[fileField] = z.string().meta({ type: "string", format: "binary" });
	}
	return {
		"multipart/form-data": { schema: z.object(shape) },
	};
};
