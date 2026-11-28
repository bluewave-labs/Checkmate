import { z } from "zod";
import { userExample, userResponseSchema } from "@/domain/users/user.schema.js";

export const ssoRefreshBodyValidation = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ssoSessionResponseSchema = z
	.object({
		user: userResponseSchema,
		token: z.string(),
		refreshToken: z.string(),
	})
	.meta({
		id: "SsoSession",
		example: { user: userExample, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", refreshToken: "p3kQ0v1m4m7oYxq2G9n8mJ0b2kq5r0Zx5uN3c8l1HfA" },
	});
