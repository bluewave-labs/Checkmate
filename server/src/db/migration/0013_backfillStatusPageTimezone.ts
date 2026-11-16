import { StatusPageModel } from "../../domain/status-pages/status-page.model.js";
import { DEFAULT_STATUS_PAGE_TIMEZONE } from "../../domain/status-pages/status-page.type.js";
import type { ILogger } from "@/utils/logger/logger.js";

export async function backfillStatusPageTimezone(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:BackfillStatusPageTimezone";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting status page timezone backfill");

		const result = await StatusPageModel.updateMany(
			{ $or: [{ timezone: { $exists: false } }, { timezone: null }, { timezone: "" }] },
			{ $set: { timezone: DEFAULT_STATUS_PAGE_TIMEZONE } }
		);

		log.info({ modifiedCount: result.modifiedCount }, "Backfilled timezone on status pages");
	} catch (error) {
		log.error({ err: error }, "Error backfilling status page timezone");
		throw error;
	}
}
