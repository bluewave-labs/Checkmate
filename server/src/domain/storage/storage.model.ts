import { Schema } from "mongoose";
import { StorageAlertReasons } from "@/domain/storage/storage.schema.js";
import type { StorageBreach } from "@/domain/storage/storage-alert.js";

// One storage alert's fields, shared by the monitor's active alerts and an incident's storage event log
export const storageBreachFields = {
	subject: { type: String, required: true },
	reason: { type: String, enum: StorageAlertReasons, required: true },
	detail: { type: String, required: true },
	device: { type: String },
	model: { type: String },
} as const;

export const storageBreachSubSchema = new Schema<StorageBreach>(storageBreachFields, { _id: false });
