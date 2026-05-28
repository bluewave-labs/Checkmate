import mongoose from "mongoose";
import { logger } from "@/utils/logger.js";
import ScriptModel from "../models/Script.js";
import ProbeServerModel from "../models/ProbeServer.js";
import AuditLogModel from "../models/AuditLog.js";

// Ensures Script, ProbeServer, and AuditLog collections have their
// indexes (including the TTL on AuditLog.createdAt) and backfills the
// scriptExitCodeSuccess default for existing monitors. Idempotent.

export async function addScriptMonitorSupport(): Promise<void> {
	const SERVICE_NAME = "Migration:AddScriptMonitorSupport";

	try {
		const db = mongoose.connection.db;
		if (!db) {
			throw new Error("Database connection is not initialized");
		}

		// Ensure indexes are built (idempotent operation).
		await ScriptModel.init();
		await ProbeServerModel.init();
		await AuditLogModel.init();

		// Backfill default scriptExitCodeSuccess on monitors that lack the field.
		// This is a no-op for existing non-script monitors but ensures consistent
		// shape so that subsequent queries do not surface `undefined` unexpectedly.
		const result = await db
			.collection("monitors")
			.updateMany({ scriptExitCodeSuccess: { $exists: false } }, { $set: { scriptExitCodeSuccess: 0 } });

		logger.info({
			service: SERVICE_NAME,
			message: `Script monitor support migration complete. Updated ${result.modifiedCount} monitor(s).`,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error during script monitor migration: ${message}` });
		throw error;
	}
}
