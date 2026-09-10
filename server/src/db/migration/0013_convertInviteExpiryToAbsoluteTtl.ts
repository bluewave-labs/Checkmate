import { InviteModel } from "../../domain/invites/invite.model.js";
import type { ILogger } from "@/utils/logger.js";

// Invites used to rely on a fixed-window TTL index: `expiry` was set to the creation
// time and MongoDB deleted the document `expireAfterSeconds` (3600) later, so every
// invite expired exactly 1 hour after creation no matter what.
//
// To let admins view and change an invite's duration, invite.model.ts now stores the
// actual expiry timestamp in `expiry` and uses a TTL index with `expireAfterSeconds: 0`
// (delete once "now" passes the stored value). This migration brings existing data and
// the existing index in line with that: it advances each invite's stored `expiry` by
// the legacy 1-hour window so already-issued invites keep behaving the same way, then
// drops the old fixed-window index so the app's post-migration syncIndexes() pass
// (see db.mongo.ts) can (re)create the new per-document one.
const LEGACY_INVITE_TTL_SECONDS = 3600;

export async function convertInviteExpiryToAbsoluteTtl(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:ConvertInviteExpiryToAbsoluteTtl";

	try {
		logger.info({ service: SERVICE_NAME, message: "Converting invite expiry to an absolute TTL timestamp" });

		const invites = await InviteModel.find({});
		for (const invite of invites) {
			const absoluteExpiry = new Date(invite.expiry.getTime() + LEGACY_INVITE_TTL_SECONDS * 1000);
			await InviteModel.updateOne({ _id: invite._id }, { $set: { expiry: absoluteExpiry } });
		}

		// On a brand new deployment the invites collection may not exist yet, in which case
		// there's no legacy index to drop (and nothing for syncIndexes() to conflict with) —
		// listIndexes on a missing collection/namespace is treated the same as "no index found".
		try {
			const indexes = await InviteModel.collection.indexes();
			const legacyIndex = indexes.find((index) => index.key?.expiry === 1 && index.expireAfterSeconds === LEGACY_INVITE_TTL_SECONDS);
			if (legacyIndex?.name) {
				await InviteModel.collection.dropIndex(legacyIndex.name);
			}
		} catch (indexError) {
			logger.debug({
				service: SERVICE_NAME,
				message: `No existing invite index to inspect/drop: ${indexError instanceof Error ? indexError.message : String(indexError)}`,
			});
		}

		logger.info({ service: SERVICE_NAME, message: `Converted ${invites.length} invite(s) to absolute expiry timestamps` });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error converting invite expiry: ${errorMessage}` });
		throw error;
	}
}
