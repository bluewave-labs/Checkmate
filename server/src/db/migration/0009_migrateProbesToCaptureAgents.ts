import mongoose from "mongoose";
import type { ILogger } from "@/utils/logger.js";
import ProbeServerModel from "../models/ProbeServer.js";
import CaptureAgentModel from "../models/CaptureAgent.js";
import MonitorModel from "@/domain/monitors/monitor.model.js";

// Migrate every ProbeServer document to a CaptureAgent and rewrite monitor
// references from `probeId` to `captureAgentId`. The migration is idempotent:
// probes already migrated (carry `migratedAt`) are skipped, and missing
// collections short-circuit early. Original probe documents are preserved so
// admins retain the audit trail of legacy registrations.

export async function migrateProbesToCaptureAgents(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateProbesToCaptureAgents";

	const db = mongoose.connection.db;
	if (!db) {
		throw new Error("Database connection is not initialized");
	}

	await ProbeServerModel.init();
	await CaptureAgentModel.init();

	const probesCollection = db.collection("probeservers");
	const probes = await probesCollection.find({ migratedAt: { $exists: false } }).toArray();

	if (probes.length === 0) {
		logger.info({
			service: SERVICE_NAME,
			message: "No legacy probe servers to migrate.",
		});
		return;
	}

	let migratedCount = 0;
	for (const probe of probes) {
		try {
			const agent = await CaptureAgentModel.create({
				teamId: probe.teamId,
				name: probe.name,
				url: probe.url,
				secret: probe.probeSecret,
				isActive: probe.isActive ?? true,
				canCollectMetrics: false,
				canExecuteScripts: true,
				tags: ["migrated-from-probe"],
				lastSeen: probe.lastSeen,
			});

			await MonitorModel.updateMany(
				{ probeId: probe._id },
				{
					$set: { captureAgentId: agent._id },
					$unset: { probeId: "", scriptExecutionTarget: "" },
				}
			);

			await probesCollection.updateOne({ _id: probe._id }, { $set: { migratedAt: new Date() } });
			migratedCount += 1;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error({
				service: SERVICE_NAME,
				message: `Failed to migrate probe ${String(probe._id)}: ${message}`,
			});
			throw error;
		}
	}

	logger.info({
		service: SERVICE_NAME,
		message: `Migrated ${migratedCount} probe server(s) to capture agents.`,
	});
}
