import { z } from "zod";
import { DeviceOSTypes, DeviceAuthTypes } from "@/types/captureAgent.js";

const objectIdLike = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid ID format");

const tagArray = z.array(z.string().trim().min(1).max(64)).max(32);

export const createCaptureAgentBodyValidation = z.object({
	name: z.string().trim().min(1, "Name is required").max(120),
	url: z.string().url("URL must be a valid URL"),
	secret: z.string().min(8, "Secret must be at least 8 characters"),
	canCollectMetrics: z.boolean().default(true),
	canExecuteScripts: z.boolean().default(false),
	tags: tagArray.optional(),
});

export const updateCaptureAgentBodyValidation = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	url: z.string().url("URL must be a valid URL").optional(),
	secret: z.string().min(8).optional(),
	canCollectMetrics: z.boolean().optional(),
	canExecuteScripts: z.boolean().optional(),
	isActive: z.boolean().optional(),
	tags: tagArray.optional(),
});

const ipAddressLike = z.string().refine(
	(value) => {
		if (!value || value.length === 0) return true;
		// Accept IPv4 dotted quad or IPv6 (loose).
		const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
		const ipv6 = /^[0-9a-fA-F:]+$/;
		return ipv4.test(value) || ipv6.test(value);
	},
	{ message: "Invalid IP address" }
);

export const createCaptureAgentDeviceBodyValidation = z.object({
	name: z.string().trim().min(1, "Name is required").max(120),
	hostname: z.string().trim().min(1, "Hostname is required").max(253),
	ipAddress: ipAddressLike.optional(),
	os: z.enum(DeviceOSTypes).default("unknown"),
	authType: z.enum(DeviceAuthTypes).default("none"),
	username: z.string().trim().max(128).optional(),
	password: z.string().min(1).max(2048).optional(),
	sshKeyFingerprint: z.string().trim().max(256).optional(),
	port: z.number().int().min(1).max(65535).optional(),
	tags: tagArray.optional(),
});

export const updateCaptureAgentDeviceBodyValidation = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	hostname: z.string().trim().min(1).max(253).optional(),
	ipAddress: ipAddressLike.optional(),
	os: z.enum(DeviceOSTypes).optional(),
	authType: z.enum(DeviceAuthTypes).optional(),
	username: z.string().trim().max(128).optional(),
	password: z.string().max(2048).optional(),
	sshKeyFingerprint: z.string().trim().max(256).optional(),
	port: z.number().int().min(1).max(65535).optional(),
	tags: tagArray.optional(),
});

export const captureAgentIdParamValidation = z.object({
	agentId: objectIdLike,
});

export const captureAgentDeviceIdParamValidation = z.object({
	agentId: objectIdLike,
	deviceId: objectIdLike,
});

export type CreateCaptureAgentDTO = z.infer<typeof createCaptureAgentBodyValidation>;
export type UpdateCaptureAgentDTO = z.infer<typeof updateCaptureAgentBodyValidation>;
export type CreateCaptureAgentDeviceDTO = z.infer<typeof createCaptureAgentDeviceBodyValidation>;
export type UpdateCaptureAgentDeviceDTO = z.infer<typeof updateCaptureAgentDeviceBodyValidation>;
