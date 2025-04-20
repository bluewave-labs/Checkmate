import mongoose from "mongoose";
import { BaseCheckSchema } from "./Check.js";
import logger from "../../utils/logger.js";
import { time } from "console";
const AuditSchema = mongoose.Schema({
	id: { type: String, required: true },
	title: { type: String, required: true },
	description: { type: String, required: true },
	score: { type: Number, required: true },
	scoreDisplayMode: { type: String, required: true },
	displayValue: { type: String, required: true },
	numericValue: { type: Number, required: true },
	numericUnit: { type: String, required: true },
});

const AuditsSchema = mongoose.Schema({
	cls: {
		type: AuditSchema,
		required: true,
	},
	si: {
		type: AuditSchema,
		required: true,
	},
	fcp: {
		type: AuditSchema,
		required: true,
	},
	lcp: {
		type: AuditSchema,
		required: true,
	},
	tbt: {
		type: AuditSchema,
		required: true,
	},
});

/**
 * Mongoose schema for storing metrics from Google Lighthouse.
 * @typedef {Object} PageSpeedCheck
 * @property {mongoose.Schema.Types.ObjectId} monitorId - Reference to the Monitor model.
 * @property {number} accessibility - Accessibility score.
 * @property {number} bestPractices - Best practices score.
 * @property {number} seo - SEO score.
 * @property {number} performance - Performance score.
 */

const PageSpeedCheck = mongoose.Schema(
	{
		...BaseCheckSchema.obj,
		accessibility: {
			type: Number,
			required: true,
		},
		bestPractices: {
			type: Number,
			required: true,
		},
		seo: {
			type: Number,
			required: true,
		},
		performance: {
			type: Number,
			required: true,
		},
		audits: {
			type: AuditsSchema,
			required: true,
		},
	},
	{ timestamps: true }
);

/**
 * Mongoose model for storing metrics from Google Lighthouse.
 * @typedef {mongoose.Model<PageSpeedCheck>} LighthouseMetricsModel
 */

PageSpeedCheck.index({ createdAt: 1 });
PageSpeedCheck.index({ monitorId: 1, createdAt: 1 });
PageSpeedCheck.index({ monitorId: 1, createdAt: -1 });

export default mongoose.model("PageSpeedCheck", PageSpeedCheck);
