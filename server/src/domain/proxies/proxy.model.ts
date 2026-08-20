import { Schema, model, type Types } from "mongoose";
import type { Proxy as ProxyEntity } from "@/domain/proxies/proxy.type.js";
import { ProxyProtocols } from "@/domain/proxies/proxy.type.js";

type ProxyDocumentBase = Omit<ProxyEntity, "id" | "teamId" | "createdAt" | "updatedAt">;

interface ProxyDocument extends ProxyDocumentBase {
	_id: Types.ObjectId;
	teamId: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const ProxySchema = new Schema<ProxyDocument>(
	{
		teamId: {
			type: Schema.Types.ObjectId,
			ref: "Team",
			immutable: true,
			required: true,
		},
		name: { type: String, required: true },
		protocol: { type: String, enum: ProxyProtocols, required: true },
		host: { type: String, required: true },
		port: { type: Number, required: true },
		username: { type: String, required: false },
		password: { type: String, required: false },
	},
	{ timestamps: true }
);

ProxySchema.index({ teamId: 1, name: 1 }, { unique: true });

const ProxyModel = model<ProxyDocument>("Proxy", ProxySchema);

export type { ProxyDocument };
export { ProxyModel };
export default ProxyModel;
