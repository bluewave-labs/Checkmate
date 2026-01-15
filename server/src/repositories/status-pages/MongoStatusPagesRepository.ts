import { IStatusPagesRepository } from "@/repositories/index.js";
import { type StatusPageDocument, StatusPageModel } from "@/db/models/StatusPage.js";
import type { StatusPage, StatusPageLogo } from "@/types/statusPage.js";
import mongoose from "mongoose";

class MongoStatusPagesRepository implements IStatusPagesRepository {
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

	private mapIdArray = (values?: Array<mongoose.Types.ObjectId | string>): string[] => {
		return values?.map((value) => this.toStringId(value)) ?? [];
	};

	private mapLogo = (logo?: StatusPageLogo | null): StatusPageLogo | undefined => {
		if (!logo) {
			return undefined;
		}
		return {
			data: logo.data,
			contentType: logo.contentType,
		};
	};

	private toEntity = (doc: StatusPageDocument): StatusPage => {
		return {
			id: this.toStringId(doc._id),
			userId: this.toStringId(doc.userId),
			teamId: this.toStringId(doc.teamId),
			type: doc.type,
			companyName: doc.companyName,
			url: doc.url,
			timezone: doc.timezone ?? undefined,
			color: doc.color,
			monitors: this.mapIdArray(doc.monitors),
			subMonitors: this.mapIdArray(doc.subMonitors),
			originalMonitors: this.mapIdArray(doc.originalMonitors),
			logo: this.mapLogo(doc.logo),
			isPublished: doc.isPublished,
			showCharts: doc.showCharts,
			showUptimePercentage: doc.showUptimePercentage,
			showAdminLoginLink: doc.showAdminLoginLink,
			customCSS: doc.customCSS,
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	removeMonitorFromStatusPages = async (monitorId: string): Promise<number> => {
		const res = await StatusPageModel.updateMany({ monitors: monitorId }, { $pull: { monitors: monitorId } });
		return res.modifiedCount;
	};
}

export default MongoStatusPagesRepository;
