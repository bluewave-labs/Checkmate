import { Schema, model, type Types } from "mongoose";
import { CONNECT_STATE_COLLECTION, type ConnectEnrollment, type ConnectState } from "@/domain/connect/connect.type.js";

interface ConnectStateDocument extends ConnectState {
	_id: Types.ObjectId;
	singleton: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const enrollmentSchema = new Schema<ConnectEnrollment>(
	{
		connectUrl: { type: String, required: true },
		agentId: { type: String, required: true },
		token: { type: String, required: true },
		apiUrl: { type: String, default: null },
	},
	{ _id: false }
);

const ConnectStateSchema = new Schema<ConnectStateDocument>(
	{
		singleton: { type: Boolean, required: true, unique: true, default: true },
		enrollment: { type: enrollmentSchema, default: null },
		remoteAccessEnabled: { type: Boolean, default: false },
	},
	{ timestamps: true, collection: CONNECT_STATE_COLLECTION }
);

const ConnectStateModel = model<ConnectStateDocument>("ConnectState", ConnectStateSchema);

export type { ConnectStateDocument };
export { ConnectStateModel };
export default ConnectStateModel;
