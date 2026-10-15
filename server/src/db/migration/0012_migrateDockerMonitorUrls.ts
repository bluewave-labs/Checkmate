import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger/logger.js";

/**
 * Rewrite docker monitor urls from the old container-name semantics to host urls.
 *
 * The old docker provider interpreted monitor.url as a container name/ID and only
 * ever talked to the local socket, so every pre-existing docker monitor's host is
 * definitionally unix:///var/run/docker.sock. The container name is preserved in
 * the description. Urls already in host form (unix:// or an absolute socket
 * path) are left untouched, which makes the migration idempotent.
 */
export async function migrateDockerMonitorUrls(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:MigrateDockerMonitorUrls";
	const log = logger.child({ service: SERVICE_NAME });

	try {
		log.info("Starting docker monitor url migration");

		const result = await MonitorModel.updateMany({ type: "docker", url: { $not: /^(unix:\/\/|\/)/ } }, [
			{
				$set: {
					description: {
						$concat: [{ $ifNull: ["$description", ""] }, " (was container: ", "$url", ")"],
					},
					url: "unix:///var/run/docker.sock",
				},
			},
		]);

		log.info({ modifiedCount: result.modifiedCount }, "Migrated docker monitors to host urls");
	} catch (error) {
		log.error({ err: error }, "Error migrating docker monitor urls");
		throw error;
	}
}
