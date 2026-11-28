import { z } from "zod";
import { SsoProviders } from "@/domain/sso/sso.type.js";
import { userExample, userResponseSchema } from "@/domain/users/user.schema.js";

export const ssoRefreshBodyValidation = z.object({
	refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ssoStartBodyValidation = z.object({
	returnOrigin: z.string().min(1, "Return origin is required"),
});

export const ssoRedeemBodyValidation = z.object({
	code: z.string().min(1, "Code is required"),
	state: z.string().min(1, "State is required"),
});

export const ssoStatusResponseSchema = z
	.object({
		enabled: z.boolean(),
		provider: z.enum(SsoProviders).nullable(),
		label: z.string().nullable(),
		enforce: z.boolean(),
	})
	.meta({ id: "SsoStatus", example: { enabled: true, provider: "entra", label: "Sign in with Microsoft", enforce: false } });

export const ssoStartResponseSchema = z
	.object({
		redirectUrl: z.string(),
		state: z.string(),
	})
	.meta({
		id: "SsoStart",
		example: {
			redirectUrl: "https://connect.checkmate.so/sso/start?agentId=a1b2&state=Zk3...&return=https%3A%2F%2Fcheckmate.example.com",
			state: "Zk3q0v1m4m7oYxq2G9n8mJ0b2kq5r0Zx5uN3c8l1HfA",
		},
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
