import { NormalizeData } from "@/utils/dataUtils.js";
import { type Monitor } from "@/domain/monitors/monitor.type.js";
import type { MonitorTag, QueryParams } from "@/types/query.js";
import pagination from "@/helpers/pagination.helper";
import { db } from "@/db/db.js";
import logger from "@/lib/logger.js";

export const getUptimeData = async (
	monitor: Monitor,
	params: QueryParams,
): Promise<Monitor> => {
	const rawChecks = await db.getAllSince(monitor.id, params.dateRange);
	const snapshotTypes = ["ping", "port", "gRPC"];
	const isSnapshotType = snapshotOnlyRequest || snapshotTypes.includes(monitor.type);
	const checks = isSnapshotType ? rawChecks.slice(0, 1) : NormalizeData(rawChecks, 10, 100);
	monitor.recentChecks = checks;

	return monitor;
};
