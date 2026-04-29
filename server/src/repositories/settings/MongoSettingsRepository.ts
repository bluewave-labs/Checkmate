import mongoose, { type UpdateQuery } from "mongoose";
import { ISettingsRepository } from "@/repositories/settings/ISettingsRepository.js";
import type { Settings, SettingsUpdate } from "@/types/index.js";
import { AppSettingsModel, type AppSettingsDocument } from "@/db/models/index.js";

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
			globalpingApiToken: doc.globalpingApiToken ?? undefined,
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

	create = async (settings: Partial<Settings>) => {
		const newSettings = await AppSettingsModel.create(settings);
		return this.toEntity(newSettings);
	};

	findSingleton = async () => {
		const settings = await AppSettingsModel.findOne({ singleton: true }).select("-__v -_id -createdAt -updatedAt -singleton").lean();
		if (!settings) {
			return null;
		}
		return this.toEntity(settings);
	};

	update = async (settings: SettingsUpdate) => {
		const $set: Record<string, unknown> = {};
		const $unset: Record<string, string> = {};

		// Iterate through settings and separate into $set and $unset
		Object.entries(settings).forEach(([key, value]) => {
			if (value === undefined || value === null) {
				$unset[key] = "";
			} else {
				$set[key] = value;
			}
		});

		const update: UpdateQuery<AppSettingsDocument> = {
			...(Object.keys($set).length > 0 && { $set }),
			...(Object.keys($unset).length > 0 && { $unset }),
		};

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

	deleteLegacy = async () => {
		const res = await AppSettingsModel.deleteMany({ version: { $exists: false } });
		return res.deletedCount > 0;
	};
}

export default MongoSettingsRepository;
