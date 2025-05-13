import mongoose from "mongoose";
import { BaseCheckSchema } from "./Check.js";
const cpuSchema = mongoose.Schema({
	physical_core: { type: Number, default: 0 },
	logical_core: { type: Number, default: 0 },
	frequency: { type: Number, default: 0 },
	temperature: { type: [Number], default: [] },
	free_percent: { type: Number, default: 0 },
	usage_percent: { type: Number, default: 0 },
});

const memorySchema = mongoose.Schema({
	total_bytes: { type: Number, default: 0 },
	available_bytes: { type: Number, default: 0 },
	used_bytes: { type: Number, default: 0 },
	usage_percent: { type: Number, default: 0 },
});

const diskSchema = mongoose.Schema({
	read_speed_bytes: { type: Number, default: 0 },
	write_speed_bytes: { type: Number, default: 0 },
	total_bytes: { type: Number, default: 0 },
	free_bytes: { type: Number, default: 0 },
	usage_percent: { type: Number, default: 0 },
});

const hostSchema = mongoose.Schema({
	os: { type: String, default: "" },
	platform: { type: String, default: "" },
	kernel_version: { type: String, default: "" },
});

const errorSchema = mongoose.Schema({
	metric: { type: [String], default: [] },
	err: { type: String, default: "" },
});

const HardwareCheckSchema = mongoose.Schema(
	{
		...BaseCheckSchema.obj,
		cpu: {
			type: cpuSchema,
			default: () => ({}),
		},
		memory: {
			type: memorySchema,
			default: () => ({}),
		},
		disk: {
			type: [diskSchema],
			default: () => [],
		},
		host: {
			type: hostSchema,
			default: () => ({}),
		},

		errors: {
			type: [errorSchema],
			default: () => [],
		},
	},
	{ timestamps: true }
);

HardwareCheckSchema.index({ createdAt: 1 });
HardwareCheckSchema.index({ monitorId: 1, createdAt: 1 });
HardwareCheckSchema.index({ monitorId: 1, createdAt: -1 });

export default mongoose.model("HardwareCheck", HardwareCheckSchema);
