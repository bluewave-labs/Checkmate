import mongoose from "mongoose";
import type { Document } from "mongodb";
import type { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "Migration:RecomputeResponseTimeFromTimings";
const CHECKS_COLLECTION = "checks";
const BACKUP_COLLECTION = "checks_backup_response_time";
const FAILED_DOCS_COLLECTION = "checks_response_time_migration_failed";
const BATCH_SIZE = 1000;
const NAMESPACE_EXISTS_CODE = 48;

interface MigrationStats {
	totalSource: number;
	totalMigrated: number;
	totalFailed: number;
}

const getDb = () => {
	const db = mongoose.connection.db;
	if (!db) {
		throw new Error("Database connection is not initialized");
	}
	return db;
};

// `checks` is a time-series collection (0002): measurement fields cannot be updated in place,
// so recomputing responseTime requires a backup → drop → recreate → re-insert rewrite.
const createTimeSeriesCollection = async () => {
	const db = getDb();
	const existing = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
	if (existing.length === 0) {
		try {
			await db.createCollection(CHECKS_COLLECTION, {
				timeseries: {
					timeField: "createdAt",
					metaField: "metadata",
					granularity: "seconds",
				},
			});
		} catch (error) {
			// Mongoose's autoCreate can create `checks` concurrently with this migration
			if ((error as { code?: number })?.code !== NAMESPACE_EXISTS_CODE) {
				throw error;
			}
		}
	}

	await db
		.collection(CHECKS_COLLECTION)
		.createIndexes([
			{ key: { createdAt: 1 } },
			{ key: { "metadata.monitorId": 1, createdAt: 1 } },
			{ key: { "metadata.monitorId": 1, createdAt: -1 } },
			{ key: { "metadata.teamId": 1, createdAt: -1 } },
			{ key: { "metadata.monitorId": 1, "metadata.type": 1, createdAt: -1 } },
			{ key: { "metadata.teamId": 1, status: 1, createdAt: -1 } },
		]);
};

const stripId = (doc: Document): Document => {
	const { _id, ...rest } = doc;
	void _id;
	return rest;
};

const recomputeResponseTime = (doc: Document): Document => {
	const rest = stripId(doc);
	const total = doc.timings?.phases?.total;
	if (typeof total === "number") {
		rest.responseTime = total;
	}
	return rest;
};

const storeFailedDocument = async (doc: Document, reason: string) => {
	const db = getDb();
	await db.collection(FAILED_DOCS_COLLECTION).insertOne({
		originalDoc: doc,
		reason,
		failedAt: new Date(),
	});
};

const streamBackupIntoChecks = async (transform: (doc: Document) => Document, collectFailures: boolean): Promise<MigrationStats> => {
	const db = getDb();
	const source = db.collection(BACKUP_COLLECTION);
	const target = db.collection(CHECKS_COLLECTION);

	const stats: MigrationStats = {
		totalSource: await source.countDocuments(),
		totalMigrated: 0,
		totalFailed: 0,
	};

	const cursor = source.find();
	// Derive the op type from the exact bulkWrite we call so it matches whichever `mongodb` copy
	// Mongoose resolves (see 0002 for the nested-node_modules background)
	type BulkOp = Parameters<typeof target.bulkWrite>[0][number];
	const operations: BulkOp[] = [];
	const invalidDocs: Document[] = [];

	while (await cursor.hasNext()) {
		const doc = await cursor.next();
		if (!doc) {
			continue;
		}

		// Time-series inserts reject documents without the timeField
		if (!doc.createdAt) {
			invalidDocs.push(doc);
			continue;
		}

		operations.push({ insertOne: { document: transform(doc) } });

		if (operations.length >= BATCH_SIZE) {
			const result = await target.bulkWrite(operations, { ordered: false });
			stats.totalMigrated += result.insertedCount;
			operations.length = 0;
		}
	}

	if (operations.length) {
		const result = await target.bulkWrite(operations, { ordered: false });
		stats.totalMigrated += result.insertedCount;
	}

	if (collectFailures) {
		for (const doc of invalidDocs) {
			await storeFailedDocument(doc, "Missing createdAt (required timeField)");
			stats.totalFailed++;
		}
	} else {
		stats.totalFailed = invalidDocs.length;
	}

	await cursor.close();

	return stats;
};

// Restore cannot be a simple rename like 0002's: $out produced a standard collection, and
// renaming it to `checks` would silently lose the time-series type. Rebuild and re-insert instead.
const restoreFromBackup = async () => {
	const db = getDb();
	const backupExists = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();
	if (backupExists.length === 0) {
		throw new Error("Cannot restore: backup collection does not exist");
	}

	const checksExists = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
	if (checksExists.length > 0) {
		await db.collection(CHECKS_COLLECTION).drop();
	}

	await createTimeSeriesCollection();
	await streamBackupIntoChecks(stripId, false);
};

export async function recomputeResponseTimeFromTimings(logger: ILogger): Promise<void> {
	const db = getDb();

	const checksExists = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
	if (checksExists.length === 0) {
		logger.info({ service: SERVICE_NAME, message: "No checks collection, nothing to migrate" });
		return;
	}

	// Fresh installs and non-HTTP-only deployments have no stored timings — skip the rewrite entirely
	const needsMigration = await db.collection(CHECKS_COLLECTION).countDocuments({ "timings.phases.total": { $exists: true } }, { limit: 1 });
	if (needsMigration === 0) {
		logger.info({ service: SERVICE_NAME, message: "No checks with timings.phases.total, nothing to migrate" });
		return;
	}

	const backupExists = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();
	if (backupExists.length > 0) {
		throw new Error(`Backup collection "${BACKUP_COLLECTION}" already exists. Please remove it manually before running migration.`);
	}

	await db
		.collection(CHECKS_COLLECTION)
		.aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }])
		.toArray();
	await db.collection(CHECKS_COLLECTION).drop();

	try {
		await createTimeSeriesCollection();
		const stats = await streamBackupIntoChecks(recomputeResponseTime, true);
		logger.info({
			service: SERVICE_NAME,
			message:
				`Migrated ${stats.totalMigrated}/${stats.totalSource} checks, ${stats.totalFailed} failed ` +
				`(failures stored in ${FAILED_DOCS_COLLECTION}); backup retained in ${BACKUP_COLLECTION}`,
		});
	} catch (error) {
		try {
			await restoreFromBackup();
			logger.error({ service: SERVICE_NAME, message: "Migration failed, checks restored from backup" });
		} catch (restoreError) {
			const restoreMessage = restoreError instanceof Error ? restoreError.message : String(restoreError);
			logger.error({
				service: SERVICE_NAME,
				message: `Migration failed AND rollback failed (${restoreMessage}) — original data is preserved in ${BACKUP_COLLECTION}`,
			});
		}
		throw error;
	}
}
