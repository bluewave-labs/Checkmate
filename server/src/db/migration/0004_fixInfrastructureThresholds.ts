import { MonitorModel } from "../models/Monitor.js";
import { logger } from "@/utils/logger.js";

/**
 * Fix infrastructure monitors that had thresholds incorrectly set to 0 or 5
 * due to the old default value. Updates them to 100 (disabled).
 */
export async function fixInfrastructureThresholds(): Promise<void> {
	const SERVICE_NAME = "Migration:FixInfrastructureThresholds";

	try {
		logger.info({ service: SERVICE_NAME, message: "Starting infrastructure threshold fix" });

		const thresholdFields = ["cpuAlertThreshold", "memoryAlertThreshold", "diskAlertThreshold", "tempAlertThreshold"];

		// Find hardware monitors with any threshold set to 0 or 5
		const filter = {
			type: "hardware",
			$or: thresholdFields.flatMap((field) => [{ [field]: 0 }, { [field]: 5 }]),
		};

		const monitors = await MonitorModel.find(filter);

		if (monitors.length === 0) {
			logger.info({ service: SERVICE_NAME, message: "No monitors with threshold value of 0 or 5 found" });
			return;
		}

		logger.info({
			service: SERVICE_NAME,
			message: `Found ${monitors.length} monitors with threshold value of 0 or 5`,
		});

		let updatedCount = 0;

		for (const monitor of monitors) {
			const update: Record<string, number> = {};

			for (const field of thresholdFields) {
				if ((monitor as any)[field] === 0 || (monitor as any)[field] === 5) {
					update[field] = 100;
				}
			}

			if (Object.keys(update).length > 0) {
				await MonitorModel.updateOne({ _id: monitor._id }, { $set: update });
				updatedCount++;
			}
		}

		logger.info({
			service: SERVICE_NAME,
			message: `Fixed ${updatedCount} monitors — thresholds updated from 0/5 to 100`,
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error fixing thresholds: ${errorMessage}` });
		throw error;
	}
}
