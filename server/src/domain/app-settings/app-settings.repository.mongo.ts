import { type UpdateQuery } from "mongoose";
import { ISettingsRepository } from "@/domain/app-settings/app-settings-repository.interface.js";
import type { Settings, SettingsUpdate } from "@/domain/app-settings/app-settings.type.js";
import { AppSettingsModel, type AppSettingsDocument } from "@/domain/app-settings/app-settings.model.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { DEFAULT_EGRESS_TARGETS } from "@/domain/egress/egress.type.js";
import { randomUUID } from "crypto";

class MongoSettingsRepository implements ISettingsRepository {
	private toEntity = (doc: AppSettingsDocument): Settings => {
		return {
			id: toStringId(doc._id),
			checkTTL: doc.checkTTL,
			language: doc.language,
			jwtSecret: doc.jwtSecret ?? undefined,
			pagespeedApiKey: doc.pagespeedApiKey ?? undefined,
			systemEmailHost: doc.systemEmailHost ?? undefined,
			systemEmailPort: doc.systemEmailPort ?? undefined,
			systemEmailAddress: doc.systemEmailAddress ?? undefined,
			systemEmailDisplayName: doc.systemEmailDisplayName ?? undefined,
			systemEmailPassword: doc.systemEmailPassword ?? undefined,
			systemEmailUser: doc.systemEmailUser ?? undefined,
			systemEmailConnectionHost: doc.systemEmailConnectionHost ?? undefined,
			systemEmailTLSServername: doc.systemEmailTLSServername ?? undefined,
			systemEmailSecure: doc.systemEmailSecure ?? false,
			systemEmailPool: doc.systemEmailPool ?? false,
			systemEmailIgnoreTLS: doc.systemEmailIgnoreTLS ?? false,
			systemEmailRequireTLS: doc.systemEmailRequireTLS ?? false,
			systemEmailRejectUnauthorized: doc.systemEmailRejectUnauthorized ?? true,
			systemEmailDisplayName: doc.systemEmailDisplayName ?? undefined,
			showURL: doc.showURL ?? false,
			singleton: doc.singleton,
			version: doc.version ?? 1,
			globalThresholds: doc.globalThresholds ?? undefined,
			globalProxyEnabled: doc.globalProxyEnabled ?? false,
			globalProxyId: doc.globalProxyId ?? undefined,
			egressCheckEnabled: doc.egressCheckEnabled ?? false,
			egressCheckTargets: doc.egressCheckTargets ?? [...DEFAULT_EGRESS_TARGETS],
			telemetryInstanceId: doc.telemetryInstanceId ?? undefined,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	create = async (settings: Partial<Settings>) => {
		const newSettings = await AppSettingsModel.create(settings);
		return this.toEntity(newSettings);
	};

	findSingleton = async () => {
		const settings = await AppSettingsModel.findOne({ singleton: true }).lean();
		if (!settings) {
			return null;
		}
		return this.toEntity(settings);
	};

	findOrCreateTelemetryInstanceId = async () => {
		await AppSettingsModel.updateOne({ singleton: true, telemetryInstanceId: { $exists: false } }, { $set: { telemetryInstanceId: randomUUID() } });
		const doc = await AppSettingsModel.findOne({ singleton: true }, { telemetryInstanceId: 1 }).lean();
		return doc?.telemetryInstanceId ?? null;
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

		const updatedSettings = await AppSettingsModel.findOneAndUpdate({}, update, {
			upsert: true,
			new: true,
		});

		return this.toEntity(updatedSettings);
	};

	deleteLegacy = async () => {
		const res = await AppSettingsModel.deleteMany({ version: { $exists: false } });
		return res.deletedCount > 0;
	};
}

export default MongoSettingsRepository;
