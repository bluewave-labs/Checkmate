import mongoose from "mongoose";

const CHECKS_COLLECTION = "checks";
const BACKUP_COLLECTION = "checks_backup";
const BATCH_SIZE = 1000;

const getDb = () => {
	const db = mongoose.connection.db;
	if (!db) {
		throw new Error("Database connection is not initialized");
	}
	return db;
};

const backupAndDropExistingCollection = async () => {
	const db = getDb();
	const collections = await db.listCollections({ name: CHECKS_COLLECTION }).toArray();
	if (collections.length === 0) {
		return false;
	}

	await db.collection(CHECKS_COLLECTION).aggregate([
		{ $match: {} },
		{ $out: BACKUP_COLLECTION },
	]).toArray();
	await db.collection(CHECKS_COLLECTION).drop();
	return true;
};

const createTimeSeriesCollection = async () => {
	const db = getDb();
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

	await db.collection(CHECKS_COLLECTION).createIndexes([
		{ key: { updatedAt: 1 } },
		{ key: { "metadata.monitorId": 1, updatedAt: 1 } },
		{ key: { "metadata.monitorId": 1, updatedAt: -1 } },
		{ key: { "metadata.teamId": 1, updatedAt: -1 } },
	]);
};

const migrateBackupData = async () => {
	const db = getDb();
	const backupExists = await db.listCollections({ name: BACKUP_COLLECTION }).toArray();
	if (backupExists.length === 0) {
		return;
	}

	const source = db.collection(BACKUP_COLLECTION);
	const target = db.collection(CHECKS_COLLECTION);
	const cursor = source.find();
	const operations: any[] = [];

	while (await cursor.hasNext()) {
		const doc = await cursor.next();
		if (!doc) {
			continue;
		}
		const metadata = {
			monitorId: doc.monitorId,
			teamId: doc.teamId,
			type: doc.type,
		};

		operations.push({ insertOne: { document: { ...doc, metadata } } });

		if (operations.length >= BATCH_SIZE) {
			await target.bulkWrite(operations);
			operations.length = 0;
		}
	}

	if (operations.length) {
		await target.bulkWrite(operations);
	}
};

export const convertChecksToTimeSeries = async () => {
	const backedUp = await backupAndDropExistingCollection();
	await createTimeSeriesCollection();
	if (backedUp) {
		await migrateBackupData();
	}
};
