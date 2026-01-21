import mongoose from "mongoose";
import { ISettingsRepository } from "@/repositories/settings/ISettingsRepository.js";
import type { Settings } from "@/types/index.js";
import { AppSettingsModel, type AppSettingsDocument } from "@/db/models/AppSettings.js";

class MongoSettingsRepository implements ISettingsRepository {
	private toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
		if (!value) {
			return "";
		}
		return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
	};

	private toDateString = (value?: Date | string | null): string => {
		if (!value) {
			return new Date(0).toISOString();
		}
		return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
	};

	protected toEntity = (doc: AppSettingsDocument): Settings => {
		return {
			id: this.toStringId(doc._id),
			checkTTL: doc.checkTTL,
			language: doc.language,
			jwtSecret: doc.jwtSecret ?? undefined,
			pagespeedApiKey: doc.pagespeedApiKey ?? undefined,
			systemEmailHost: doc.systemEmailHost ?? undefined,
			systemEmailPort: doc.systemEmailPort ?? undefined,
			systemEmailAddress: doc.systemEmailAddress ?? undefined,
			systemEmailPassword: doc.systemEmailPassword ?? undefined,
			systemEmailUser: doc.systemEmailUser ?? undefined,
			systemEmailConnectionHost: doc.systemEmailConnectionHost ?? undefined,
			systemEmailTLSServername: doc.systemEmailTLSServername ?? undefined,
			systemEmailSecure: doc.systemEmailSecure ?? false,
			systemEmailPool: doc.systemEmailPool ?? false,
			systemEmailIgnoreTLS: doc.systemEmailIgnoreTLS ?? false,
			systemEmailRequireTLS: doc.systemEmailRequireTLS ?? false,
			systemEmailRejectUnauthorized: doc.systemEmailRejectUnauthorized ?? true,
			showURL: doc.showURL ?? false,
			singleton: doc.singleton,
			version: doc.version ?? 1,
			globalThresholds: doc.globalThresholds ?? undefined,
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	update = async (settings: Partial<Settings>) => {
		const update: Record<string, any> = { $set: { ...settings } };

		if (settings.pagespeedApiKey === "") {
			update.$unset = { pagespeedApiKey: "" };
			delete update.$set.pagespeedApiKey;
		}

		if (settings.systemEmailPassword === "") {
			update.$unset = { systemEmailPassword: "" };
			delete update.$set.systemEmailPassword;
		}

		await AppSettingsModel.findOneAndUpdate({}, update, {
			upsert: true,
		});

		const updatedSettings = await AppSettingsModel.findOneAndUpdate({}, update, {
			upsert: true,
			new: true,
			projection: "-__v -_id -createdAt -updatedAt -singleton",
		});

		return this.toEntity(updatedSettings);
	};
}

export default MongoSettingsRepository;
