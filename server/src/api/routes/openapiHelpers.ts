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

export const errorEnvelope = z.object({ status: z.number(), msg: z.string() }).meta({ id: "Error" });
export type ErrorBody = z.infer<typeof errorEnvelope>;

export const bearer = [{ bearerAuth: [] }];

export const json = <T extends z.ZodType>(schema: T, example?: unknown) => ({
	"application/json": example === undefined ? { schema } : { schema, example },
});

export const errorJson = (description: string) => ({ description, content: json(errorEnvelope) });

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
