import { AuditLogModel } from "@/db/models/AuditLog.js";
import type { AuditLogInput, IAuditRepository } from "@/repositories/audit/IAuditRepository.js";

class MongoAuditRepository implements IAuditRepository {
	log = async (entry: AuditLogInput): Promise<void> => {
		// Audit logs are best-effort and must never break the calling flow.
		// Errors are swallowed here intentionally; the audit attempt is
		// already a side effect of the caller's primary action.
		try {
			await AuditLogModel.create({
				teamId: entry.teamId,
				userId: entry.userId,
				action: entry.action,
				resourceType: entry.resourceType,
				resourceId: entry.resourceId,
				metadata: entry.metadata ?? {},
			});
		} catch {
			// Intentionally suppress – the audit failure must not block the
			// primary user action. A failed audit is logged by the caller
			// if it cares.
		}
	};
}

export { MongoAuditRepository };
export default MongoAuditRepository;
