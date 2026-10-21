import type { z } from "zod";
import type { collectionDiagnosticsSchema, diagnosticsSchema, mongoDiagnosticsSchema } from "@/domain/diagnostics/diagnostic.schema.js";

export type CollectionDiagnostics = z.infer<typeof collectionDiagnosticsSchema>;
export type MongoDiagnostics = z.infer<typeof mongoDiagnosticsSchema>;
export type Diagnostics = z.infer<typeof diagnosticsSchema>;
