import { IStatusPagesRepository } from "@/repositories/index.js";
import { type StatusPageDocument, StatusPageModel } from "@/db/models/StatusPage.js";
import type { StatusPage } from "@/types/statusPage.js";
import mongoose from "mongoose";

class MongoStatusPagesRepository implements IStatusPagesRepository {
	private toEntity(doc: StatusPageDocument): StatusPage {
		const toStringId = (value: unknown): string => {
			if (value instanceof mongoose.Types.ObjectId) {
				return value.toString();
			}
			return value?.toString() ?? "";
		};

		const toDateString = (value: Date | string): string => {
			return value instanceof Date ? value.toISOString() : value;
		};

		const mapIdArray = (values?: mongoose.Types.ObjectId[]): string[] => {
			return values?.map((value) => toStringId(value)) ?? [];
		};

		return {
			id: toStringId(doc._id),
			userId: toStringId(doc.userId),
			teamId: toStringId(doc.teamId),
			type: doc.type,
			companyName: doc.companyName,
			url: doc.url,
			timezone: doc.timezone ?? undefined,
			color: doc.color,
			monitors: mapIdArray(doc.monitors),
			subMonitors: mapIdArray(doc.subMonitors),
			originalMonitors: doc.originalMonitors?.map((value) => toStringId(value)),
			logo: doc.logo ?? undefined,
			isPublished: doc.isPublished,
			showCharts: doc.showCharts,
			showUptimePercentage: doc.showUptimePercentage,
			showAdminLoginLink: doc.showAdminLoginLink,
			customCSS: doc.customCSS,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	}

	removeMonitorFromStatusPages = async (monitorId: string): Promise<number> => {
		const res = await StatusPageModel.updateMany({ monitors: monitorId }, { $pull: { monitors: monitorId } });
		return res.modifiedCount;
	};
}

export default MongoStatusPagesRepository;
