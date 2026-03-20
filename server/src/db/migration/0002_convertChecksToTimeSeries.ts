import mongoose from "mongoose";
import type { Document, AnyBulkWriteOperation } from "mongodb";

const CHECKS_COLLECTION = "checks";
const BACKUP_COLLECTION = "checks_backup";
const FAILED_DOCS_COLLECTION = "checks_migration_failed";
const BATCH_SIZE = 1000;

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

	await db.collection(BACKUP_COLLECTION).rename(CHECKS_COLLECTION);
};

const backupAndDropExistingCollection = async () => {
	const db = getDb();
	const collections = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
	if (collections.length === 0) {
		return false;
	}
	const backupExists = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();
	if (backupExists.length > 0) {
		throw new Error(`Backup collection "${BACKUP_COLLECTION}" already exists. ` + `Please remove it manually before running migration.`);
	}

	await db
		.collection(CHECKS_COLLECTION)
		.aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }])
		.toArray();
	await db.collection(CHECKS_COLLECTION).drop();
	return true;
};

const createTimeSeriesCollection = async (backedUp: boolean) => {
	const db = getDb();
	try {
		const existing = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
		if (existing.length === 0) {
			await db.createCollection(CHECKS_COLLECTION, {
				timeseries: {
					timeField: "createdAt",
					metaField: "metadata",
					granularity: "seconds",
				},
			});
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
	} catch (error) {
		if (backedUp) {
			await restoreFromBackup();
		}
		throw error;
	}
};

const validateDocument = (doc: Document): boolean => {
	if (!doc.createdAt) {
		return false;
	}
	if (!doc.monitorId || !doc.teamId || !doc.type) {
		return false;
	}
	return true;
};

const storeFailedDocument = async (doc: Document, reason: string) => {
	const db = getDb();
	await db.collection(FAILED_DOCS_COLLECTION).insertOne({
		originalDoc: doc,
		reason,
		failedAt: new Date(),
	});
};

const migrateBackupData = async (backedUp: boolean): Promise<MigrationStats> => {
	const db = getDb();
	const backupExists = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();
	if (backupExists.length === 0) {
		return { totalSource: 0, totalMigrated: 0, totalFailed: 0 };
	}

	const stats: MigrationStats = {
		totalSource: 0,
		totalMigrated: 0,
		totalFailed: 0,
	};

	try {
		const source = db.collection(BACKUP_COLLECTION);
		const target = db.collection(CHECKS_COLLECTION);

		stats.totalSource = await source.countDocuments();

		const cursor = source.find().addCursorFlag("noCursorTimeout", true);
		const operations: AnyBulkWriteOperation<Document>[] = [];
		const invalidDocs: Document[] = [];

		while (await cursor.hasNext()) {
			const doc = await cursor.next();
			if (!doc) {
				continue;
			}

			if (!validateDocument(doc)) {
				invalidDocs.push(doc);
				continue;
			}

			const { _id, monitorId, teamId, type, ...rest } = doc;
			void _id;
			const metadata = { monitorId, teamId, type };
			operations.push({ insertOne: { document: { ...rest, metadata } } });

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

		for (const doc of invalidDocs) {
			await storeFailedDocument(doc, "Missing required fields (createdAt, monitorId, teamId, or type)");
			stats.totalFailed++;
		}

		await cursor.close();

		return stats;
	} catch (error) {
		if (backedUp) {
			await restoreFromBackup();
		}
		throw error;
	}
};

export const convertChecksToTimeSeries = async () => {
	const backedUp = await backupAndDropExistingCollection();
	await createTimeSeriesCollection(backedUp);
	if (backedUp) {
		const stats = await migrateBackupData(backedUp);
		console.log(
			`Migration completed: ${stats.totalMigrated} documents migrated, ` +
				`${stats.totalFailed} documents failed (stored in ${FAILED_DOCS_COLLECTION})`
		);
	}
};
