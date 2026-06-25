import MonitorModel from "@/domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger.js";

// Strip path components from legacy script monitor URLs so the scriptService
// can correctly append /api/v1/script. Monitors created before this migration
// may have stored the full capture metrics URL (e.g. http://host:59232/api/v1/metrics)
// instead of the capture agent base URL (http://host:59232).

export async function normalizeScriptMonitorUrls(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:NormalizeScriptMonitorUrls";

	const monitors = await MonitorModel.find({
		type: "script",
		captureAgentId: { $exists: false },
	}).lean();

	let fixedCount = 0;
	for (const monitor of monitors) {
		try {
			const url = new URL(monitor.url);
			const baseUrl = url.origin;
			if (baseUrl !== monitor.url.replace(/\/$/, "")) {
				await MonitorModel.updateOne({ _id: monitor._id }, { $set: { url: baseUrl } });
				fixedCount++;
			}
		} catch {
			// Not a valid URL — leave untouched
		}
	}

	logger.info({
		service: SERVICE_NAME,
		message: `Normalized ${fixedCount} script monitor URL(s).`,
	});
}
