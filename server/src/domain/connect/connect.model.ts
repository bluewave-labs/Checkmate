import { Schema, model } from "mongoose";
import { CONNECT_STATE_COLLECTION, type ConnectState } from "@/domain/connect/connect.type.js";

interface ConnectStateDocument extends ConnectState {
	singleton: boolean;
}

const enrollmentSchema = new Schema(
	{
		connectUrl: { type: String, required: true },
		agentId: { type: String, required: true },
		token: { type: String, required: true },
		apiUrl: { type: String, default: null },
	},
	{ _id: false }
);

const scheduleSchema = new Schema(
	{
		enabled: { type: Boolean, required: true },
		intervalHours: { type: Number, required: true },
		kind: { type: String, enum: ["full", "config"], required: true },
		lastStartedAt: { type: String, default: null },
	},
	{ _id: false }
);

// Excluded from Connect backups (see connect.backup.ts) so restoring an older
// backup cannot replace the live enrollment or recovery key.
const ConnectStateSchema = new Schema<ConnectStateDocument>(
	{
		singleton: { type: Boolean, required: true, unique: true, default: true },
		enrollment: { type: enrollmentSchema, default: null },
		remoteAccessEnabled: { type: Boolean, default: false },
		recoveryKey: { type: String, default: null },
		schedule: { type: scheduleSchema, default: null },
	},
	{ timestamps: true, collection: CONNECT_STATE_COLLECTION }
);

export const ConnectStateModel = model<ConnectStateDocument>("ConnectState", ConnectStateSchema);
