import mongoose from "mongoose";
import { BaseCheckSchema } from "./Check.js";

const networkInterfaceSchema = mongoose.Schema({
	name: { type: String, required: true },
	bytes_sent: { type: Number, default: 0 },
	bytes_recv: { type: Number, default: 0 },
	packets_sent: { type: Number, default: 0 },
	packets_recv: { type: Number, default: 0 },
	err_in: { type: Number, default: 0 },
	err_out: { type: Number, default: 0 },
	drop_in: { type: Number, default: 0 },
	drop_out: { type: Number, default: 0 },
	fifo_in: { type: Number, default: 0 },
	fifo_out: { type: Number, default: 0 },
});

const captureSchema = mongoose.Schema({
	version: { type: String, default: "" },
	mode: { type: String, default: "" },
});

const NetworkCheckSchema = mongoose.Schema(
	{
		...BaseCheckSchema.obj,
		data: {
			type: [networkInterfaceSchema],
			default: () => [],
		},
		capture: {
			type: captureSchema,
			default: () => ({}),
		},
		errors: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
	},
	{ timestamps: true }
);

NetworkCheckSchema.index({ createdAt: 1 });
NetworkCheckSchema.index({ monitorId: 1, createdAt: 1 });
NetworkCheckSchema.index({ monitorId: 1, createdAt: -1 });

export default mongoose.model("NetworkCheck", NetworkCheckSchema);
