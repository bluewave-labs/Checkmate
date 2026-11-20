import type { Mongoose } from "mongoose";
import type { IDb } from "@/db/db.interface.js";
import { AppError, internalError } from "@/utils/AppError.js";
import type { IDiagnosticsRepository } from "@/domain/diagnostics/diagnostic.repository.interface.js";
import type { CollectionDiagnostics, MongoConnectionInfo, MongoOpCounters } from "@/domain/diagnostics/diagnostic.type.js";

const SERVICE_NAME = "MongoDiagnosticsRepository";

class MongoDiagnosticsRepository implements IDiagnosticsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(private db: IDb<Mongoose>) {}

	private getConnection = async () => {
		const { connection } = await this.db.getConnection();
		const db = connection.db;
		if (!db) {
			throw new AppError(internalError, { message: "Database connection is not available", service: SERVICE_NAME });
		}
		return { connection, db };
	};

	getConnectionInfo = async (): Promise<MongoConnectionInfo> => {
		const { connection } = await this.getConnection();
		return {
			readyState: connection.readyState,
			host: connection.host,
			port: connection.port,
			dbName: connection.name,
		};
	};

	getOpCounters = async (): Promise<MongoOpCounters> => {
		const { db } = await this.getConnection();
		const res = await db.command({ serverStatus: 1 });
		return {
			reads: (res.opcounters?.query ?? 0) + (res.opcounters?.getmore ?? 0),
			inserts: res.opcounters?.insert ?? 0,
			updates: res.opcounters?.update ?? 0,
			deletes: res.opcounters?.delete ?? 0,
			uptimeMs: Number(res.uptimeMillis ?? 0),
		};
	};

	getDatabaseSize = async (): Promise<number> => {
		const { db } = await this.getConnection();
		const stats = await db.stats();
		return stats.totalSize ?? (stats.storageSize ?? 0) + (stats.indexSize ?? 0);
	};

	listCollectionNames = async (): Promise<string[]> => {
		const { db } = await this.getConnection();
		const collections = await db.collections();
		return collections.map((collection) => collection.collectionName).filter((name) => !name.startsWith("system"));
	};

	getCollectionStats = async (name: string): Promise<CollectionDiagnostics> => {
		const { db } = await this.getConnection();
		const stats = await db.command({ collStats: name });
		const documentCount = typeof stats.count === "number" ? stats.count : await db.collection(name).countDocuments({});
		const entry: CollectionDiagnostics = {
			name,
			documentCount,
			storageSize: stats.storageSize ?? 0,
			totalIndexSize: stats.totalIndexSize ?? 0,
			totalSize: stats.totalSize ?? (stats.storageSize ?? 0) + (stats.totalIndexSize ?? 0),
		};
		if (stats.timeseries?.bucketCount !== undefined) {
			entry.bucketCount = stats.timeseries.bucketCount;
		}
		return entry;
	};
}

export default MongoDiagnosticsRepository;
