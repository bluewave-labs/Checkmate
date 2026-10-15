import { z } from "zod";
import { UserRoles } from "./user.type.js";

export const userProfileImageSchema = z.object({
	data: z.instanceof(Buffer).optional(),
	contentType: z.string().optional(),
});

export const userSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
	// Absent for users that authenticate through an external identity provider
	password: z.string().optional(),
	avatarImage: z.string().optional(),
	profileImage: userProfileImageSchema.optional(),
	isActive: z.boolean(),
	isVerified: z.boolean(),
	role: z.array(z.enum(UserRoles)),
	teamId: z.string(),
	checkTTL: z.number().optional(),
	// Identity provider linkage; set on the first successful SSO login
	ssoIssuer: z.string().optional(),
	ssoSubject: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const userExample = {
	id: "65f1c2a4d8b9e0123456789a",
	firstName: "Ada",
	lastName: "Lovelace",
	email: "ada@example.com",
	isActive: true,
	isVerified: true,
	role: ["admin"],
	teamId: "65f1c2a4d8b9e01234567890",
	createdAt: "2026-04-01T10:00:00.000Z",
	updatedAt: "2026-04-15T14:30:00.000Z",
};

export const userResponseSchema = userSchema
	.omit({ password: true, profileImage: true, ssoIssuer: true, ssoSubject: true })
	.meta({ id: "User", example: userExample });
