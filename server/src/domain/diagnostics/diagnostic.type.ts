import type { z } from "zod";
import type { collectionDiagnosticsSchema, diagnosticsSchema, mongoDiagnosticsSchema } from "@/domain/diagnostics/diagnostic.schema.js";

export type CollectionDiagnostics = z.infer<typeof collectionDiagnosticsSchema>;
export type MongoDiagnostics = z.infer<typeof mongoDiagnosticsSchema>;
export type Diagnostics = z.infer<typeof diagnosticsSchema>;

export interface MongoConnectionInfo {
	readyState: number;
	host: string;
	port: number;
	dbName: string;
}

export interface MongoOpCounters {
	reads: number;
	inserts: number;
	updates: number;
	deletes: number;
	uptimeMs: number;
}
