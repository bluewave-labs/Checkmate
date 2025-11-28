import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  systemEmailHost?: string;
  systemEmailPort?: number;
  systemEmailAddress?: string;
  systemEmailPassword?: string;
  systemEmailUser?: string;
  systemEmailConnectionHost?: string;
  systemEmailTLSServername?: string;
  systemEmailSecure: boolean;
  systemEmailPool: boolean;
  systemEmailIgnoreTLS: boolean;
  systemEmailRequireTLS: boolean;
  systemEmailRejectUnauthorized: boolean;
  checksRetentionDays: number;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    _id: { type: String, default: "global", immutable: true },
    systemEmailHost: { type: String },
    systemEmailPort: { type: Number },
    systemEmailAddress: { type: String },
    systemEmailPassword: { type: String },
    systemEmailUser: { type: String },
    systemEmailConnectionHost: { type: String, default: "localhost" },
    systemEmailTLSServername: { type: String },
    systemEmailSecure: { type: Boolean, default: false },
    systemEmailPool: { type: Boolean, default: false },
    systemEmailIgnoreTLS: { type: Boolean, default: false },
    systemEmailRequireTLS: { type: Boolean, default: false },
    systemEmailRejectUnauthorized: { type: Boolean, default: true },
    checksRetentionDays: { type: Number, default: 90 },
  },
  {
    timestamps: true,
    collection: "system_settings",
  }
);

SystemSettingsSchema.index({ _id: 1 }, { unique: true });

export const SystemSettings = mongoose.model<ISystemSettings>(
  "SystemSettings",
  SystemSettingsSchema
);
