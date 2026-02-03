import { IStatusPagesRepository } from "@/repositories/index.js";
import { type StatusPageDocument, StatusPageModel } from "@/db/models/StatusPage.js";
import type { StatusPage, StatusPageLogo, StatusPageLogoDocument } from "@/types/statusPage.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";

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

	private mapLogo = (logo?: StatusPageLogoDocument | null): StatusPageLogo | undefined => {
		if (!logo) {
			return undefined;
		}
		// Convert Buffer to base64 string for JSON serialization
		const base64Data = Buffer.isBuffer(logo.data)
			? logo.data.toString("base64")
			: logo.data;
		return {
			data: base64Data,
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

	private mapDocuments = (documents: StatusPageDocument[]): StatusPage[] => {
		if (!documents?.length) {
			return [];
		}
		return documents.map((doc) => this.toEntity(doc));
	};

	create = async (userId: string, teamId: string, image: Express.Multer.File | undefined, data: Partial<StatusPage>): Promise<StatusPage> => {
		const statusPage = new StatusPageModel({
			...data,
			userId,
			teamId,
		});
		if (image) {
			statusPage.logo = {
				data: image.buffer as Buffer,
				contentType: image.mimetype,
			};
		}
		await statusPage.save();
		return this.toEntity(statusPage);
	};

	findByUrl = async (url: string): Promise<StatusPage> => {
		const statusPage = await StatusPageModel.findOne({
			url,
		});
		if (!statusPage) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}
		return this.toEntity(statusPage);
		// Get status page
	};

	findByTeamId = async (teamId: string): Promise<StatusPage[]> => {
		const statusPages = await StatusPageModel.find({ teamId });
		return this.mapDocuments(statusPages);
	};

	updateById = async (id: string, teamId: string, image: Express.Multer.File | undefined, patch: Partial<StatusPage>): Promise<StatusPage> => {
		const updateData: any = { ...patch };
		if (image) {
			updateData.logo = {
				data: image.buffer as Buffer,
				contentType: image.mimetype,
			};
		}

		const statusPage = await StatusPageModel.findOneAndUpdate({ teamId, _id: id }, updateData, {
			new: true,
		});

		if (!statusPage) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}

		return this.toEntity(statusPage);
	};

	deleteById = async (id: string, teamId: string): Promise<StatusPage> => {
		const statusPage = await StatusPageModel.findOneAndDelete({ _id: id, teamId });
		if (!statusPage) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}
		return this.toEntity(statusPage);
	};

	removeMonitorFromStatusPages = async (monitorId: string): Promise<number> => {
		const res = await StatusPageModel.updateMany({ monitors: monitorId }, { $pull: { monitors: monitorId } });
		return res.modifiedCount;
	};
}

export default MongoStatusPagesRepository;
