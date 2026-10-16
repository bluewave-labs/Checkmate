import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import JobModel from "../../domain/jobs/job.model.js";
import type { ILogger } from "@/utils/logger/logger.js";
import { MIN_MONITOR_INTERVAL_MS } from "@/domain/monitors/monitor.type.js";

/**
 * Migrate monitor interval and job intervalMs from seconds to milliseconds.
 *
 * In legacy environments or monitors created via API with seconds (e.g. 300 for 5m,
 * 3600 for 1h), intervals were stored in seconds but the queue consumes intervalMs in
 * milliseconds. This caused checks to fire continuously (e.g. every 300ms instead of 300,000ms).
 *
 * Any interval < 10,000 (minimum interval is 10s = 10,000ms) or equal to 86,400 (1 day in seconds)
 * is converted to milliseconds by multiplying by 1000.
 */
export async function migrateMonitorIntervalToMs(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateMonitorIntervalToMs";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting monitor interval migration to milliseconds");

		// 1. Update monitors where interval < MIN_MONITOR_INTERVAL_MS or interval == 86400
		const monitorResult = await MonitorModel.updateMany(
			{
				$or: [{ interval: { $lt: MIN_MONITOR_INTERVAL_MS } }, { interval: 86400 }],
			},
			[
				{
					$set: {
						interval: { $multiply: ["$interval", 1000] },
					},
				},
			]
		);

		// 2. Update jobs where type == "check" and intervalMs < MIN_MONITOR_INTERVAL_MS or intervalMs == 86400
		const jobResult = await JobModel.updateMany(
			{
				type: "check",
				$or: [{ intervalMs: { $lt: MIN_MONITOR_INTERVAL_MS } }, { intervalMs: 86400 }],
			},
			[
				{
					$set: {
						intervalMs: { $multiply: ["$intervalMs", 1000] },
					},
				},
			]
		);

		log.info(
			{ modifiedMonitors: monitorResult.modifiedCount, modifiedJobs: jobResult.modifiedCount },
			`Migrated ${monitorResult.modifiedCount} monitors and ${jobResult.modifiedCount} check jobs to millisecond intervals`
		);
	} catch (error) {
		log.error({ err: error }, "Error migrating monitor intervals");
		throw error;
	}
}
