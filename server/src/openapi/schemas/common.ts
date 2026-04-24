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
