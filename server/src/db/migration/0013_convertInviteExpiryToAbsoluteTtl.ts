import { InviteModel } from "../../domain/invites/invite.model.js";
import type { ILogger } from "@/utils/logger.js";

const LEGACY_INVITE_TTL_SECONDS = 3600;

const findLegacyIndex = async () => {
	try {
		const indexes = await InviteModel.collection.indexes();
		return indexes.find((index) => index.key?.expiry === 1 && index.expireAfterSeconds === LEGACY_INVITE_TTL_SECONDS);
	} catch {
		return undefined;
	}
};

export async function convertInviteExpiryToAbsoluteTtl(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:ConvertInviteExpiryToAbsoluteTtl";

	try {
		const legacyIndex = await findLegacyIndex();
		if (legacyIndex?.name === undefined) {
			logger.info({ service: SERVICE_NAME, message: "No legacy invite TTL index found, skipping" });
			return;
		}

		logger.info({ service: SERVICE_NAME, message: "Converting invite expiry to an absolute TTL timestamp" });

		const result = await InviteModel.collection.updateMany({}, [{ $set: { expiry: { $add: ["$expiry", LEGACY_INVITE_TTL_SECONDS * 1000] } } }]);
		await InviteModel.collection.dropIndex(legacyIndex.name);

		logger.info({ service: SERVICE_NAME, message: `Converted ${result.modifiedCount} invite(s) to absolute expiry timestamps` });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error converting invite expiry: ${errorMessage}` });
		throw error;
	}
}
