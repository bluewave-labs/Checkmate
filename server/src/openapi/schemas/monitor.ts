import "../registry.js";
import { z } from "zod";
import { GeoContinents } from "@/types/geoCheck.js";
import { MonitorMatchMethods, MonitorTypes } from "@/types/monitor.js";

export const MonitorSchema = z
	.object({
		_id: z.string().openapi({ example: "65f1c2a4d8b9e0123456789a" }),
		name: z.string(),
		description: z.string().optional(),
		type: z.enum(MonitorTypes),
		url: z.string(),
		port: z.number().optional(),
		isActive: z.boolean(),
		interval: z.number(),
		status: z.enum(["up", "down", "paused", "initializing", "maintenance", "breached"]),
		statusWindowSize: z.number(),
		statusWindowThreshold: z.number(),
		ignoreTlsErrors: z.boolean(),
		useAdvancedMatching: z.boolean(),
		jsonPath: z.string().optional(),
		expectedValue: z.string().optional(),
		matchMethod: z.enum(MonitorMatchMethods).optional(),
		notifications: z.array(z.string()),
		secret: z.string().optional(),
		cpuAlertThreshold: z.number(),
		memoryAlertThreshold: z.number(),
		diskAlertThreshold: z.number(),
		tempAlertThreshold: z.number(),
		selectedDisks: z.array(z.string()),
		gameId: z.string().optional(),
		grpcServiceName: z.string().optional(),
		group: z.string().nullable().optional(),
		geoCheckEnabled: z.boolean(),
		geoCheckLocations: z.array(z.enum(GeoContinents)),
		geoCheckInterval: z.number(),
		teamId: z.string(),
		userId: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough()
	.openapi("Monitor");

export const MonitorWithChecksListSchema = z
	.object({
		monitors: z.array(MonitorSchema),
		monitorCount: z.number(),
		filteredCount: z.number(),
	})
	.passthrough()
	.openapi("MonitorWithChecksList");

export const CertificateInfoSchema = z
	.object({
		certificateDate: z.string(),
	})
	.openapi("CertificateInfo");

export const NotificationsUpdateResultSchema = z
	.object({
		modifiedCount: z.number(),
	})
	.openapi("NotificationsUpdateResult");

export const ImportResultSchema = z
	.object({
		imported: z.number(),
	})
	.passthrough()
	.openapi("ImportResult");
