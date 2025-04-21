import mongoose from "mongoose";
/**
 * MaintenanceWindow Schema
 * @module MaintenanceWindow
 * @typedef {Object} MaintenanceWindow
 * @property {mongoose.Schema.Types.ObjectId} monitorId - The ID of the monitor. This is a reference to the Monitor model and is immutable.
 * @property {Boolean} active - Indicates whether the maintenance window is active.
 * @property {Number} repeat - Indicates how often this maintenance window should repeat.
 * @property {Date} start - The start date and time of the maintenance window.
 * @property {Date} end - The end date and time of the maintenance window.
 * @property {Date} expiry - The expiry date and time of the maintenance window. This is used for MongoDB's TTL index to automatically delete the document at this time. This field is set to the same value as `end` when `oneTime` is `true`.
 *
 * @example
 *
 * let maintenanceWindow = new MaintenanceWindow({
 *   monitorId: monitorId,
 *   active: active,
 *   repeat: repeat,
 *   start: start,
 *   end: end,
 * });
 *
 * if (repeat === 0) {
 *   maintenanceWindow.expiry = end;
 * }
 *
 */

const MaintenanceWindow = mongoose.Schema(
	{
		monitorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
		},
		teamId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
		name: {
			type: String,
		},
		repeat: {
			type: Number,
		},
		start: {
			type: Date,
		},
		end: {
			type: Date,
		},
		expiry: {
			type: Date,
			index: { expires: "0s" },
		},
	},

	{
		timestamps: true,
	}
);

export default mongoose.model("MaintenanceWindow", MaintenanceWindow);
