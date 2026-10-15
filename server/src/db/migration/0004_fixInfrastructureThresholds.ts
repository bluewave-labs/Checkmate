import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

/**
 * Fix infrastructure monitors that had thresholds incorrectly set to 0 or 5
 * due to the old default value. Updates them to 100 (disabled).
 */
export async function fixInfrastructureThresholds(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:FixInfrastructureThresholds";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting infrastructure threshold fix");

		const thresholdFields = ["cpuAlertThreshold", "memoryAlertThreshold", "diskAlertThreshold", "tempAlertThreshold"];

		// Find hardware monitors with any threshold set to 0 or 5
		const filter = {
			type: "hardware",
			$or: thresholdFields.flatMap((field) => [{ [field]: 0 }, { [field]: 5 }]),
		};

		const monitors = await MonitorModel.find(filter);

		if (monitors.length === 0) {
			log.info("No monitors with threshold value of 0 or 5 found");
			return;
		}

		log.info({ count: monitors.length }, "Found monitors with threshold value of 0 or 5");

		let updatedCount = 0;

		for (const monitor of monitors) {
			const update: Record<string, number> = {};

			for (const field of thresholdFields) {
				const value = monitor.get(field);
				if (value === 0 || value === 5) {
					update[field] = 100;
				}
			}

			if (Object.keys(update).length > 0) {
				await MonitorModel.updateOne({ _id: monitor._id }, { $set: update });
				updatedCount++;
			}
		}

		log.info({ updatedCount }, "Fixed monitors, thresholds updated from 0/5 to 100");
	} catch (error) {
		log.error({ err: error }, "Error fixing thresholds");
		throw error;
	}
}
