import { Schema, model, type Types } from "mongoose";
import type { StatusPage, StatusPageLogoDocument } from "@/types/statusPage.js";
import {
	DEFAULT_STATUS_PAGE_THEME,
	DEFAULT_STATUS_PAGE_THEME_MODE,
	StatusPageThemeModes,
	StatusPageThemes,
	StatusPageTypes,
} from "@/types/statusPage.js";

type StatusPageDocumentBase = Omit<
	StatusPage,
	"id" | "userId" | "teamId" | "monitors" | "subMonitors" | "originalMonitors" | "logo" | "createdAt" | "updatedAt"
> & {
	monitors: Types.ObjectId[];
	subMonitors: Types.ObjectId[];
	originalMonitors?: Types.ObjectId[];
	logo?: StatusPageLogoDocument | null;
};

interface StatusPageDocument extends StatusPageDocumentBase {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const logoSchema = new Schema<StatusPageLogoDocument>(
	{
		data: { type: Buffer },
		contentType: { type: String },
	},
	{ _id: false }
);

const StatusPageSchema = new Schema<StatusPageDocument>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			immutable: true,
			required: true,
		},
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		type: {
			type: [String],
			required: true,
			default: ["uptime"],
			enum: StatusPageTypes,
		},
		companyName: {
			type: String,
			required: true,
			default: "",
		},
		url: {
			type: String,
			unique: true,
			required: true,
			default: "",
		},
		timezone: {
			type: String,
		},
		color: {
			type: String,
			default: "#4169E1",
		},
		monitors: [
			{
				type: Schema.Types.ObjectId,
				ref: "Monitor",
				required: true,
			},
		],
		subMonitors: [
			{
				type: Schema.Types.ObjectId,
				ref: "Monitor",
				required: true,
			},
		],
		logo: {
			type: logoSchema,
			default: null,
		},
		isPublished: {
			type: Boolean,
			default: false,
		},
		showCharts: {
			type: Boolean,
			default: true,
		},
		showUptimePercentage: {
			type: Boolean,
			default: true,
		},
		showAdminLoginLink: {
			type: Boolean,
			default: false,
		},
		showInfrastructure: {
			type: Boolean,
			default: false,
		},
		customCSS: {
			type: String,
			default: "",
		},
		theme: {
			type: String,
			enum: StatusPageThemes,
			default: DEFAULT_STATUS_PAGE_THEME,
		},
		themeMode: {
			type: String,
			enum: StatusPageThemeModes,
			default: DEFAULT_STATUS_PAGE_THEME_MODE,
		},
	},
	{ timestamps: true }
);

const StatusPageModel = model<StatusPageDocument>("StatusPage", StatusPageSchema);

export type { StatusPageDocument };
export { StatusPageModel };
export default StatusPageModel;
