import type { CollectionDiagnostics, MongoConnectionInfo, MongoOpCounters } from "@/domain/diagnostics/diagnostic.type.js";

export interface IDiagnosticsRepository {
	getConnectionInfo(): Promise<MongoConnectionInfo>;
	getOpCounters(): Promise<MongoOpCounters>;
	getDatabaseSize(): Promise<number>;
	listCollectionNames(): Promise<string[]>;
	getCollectionStats(name: string): Promise<CollectionDiagnostics>;
}
