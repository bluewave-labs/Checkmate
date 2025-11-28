import mongoose, { Schema, Document, Types } from "mongoose";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface IOrg extends Document {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;

  // Entitlements & plan
  planKey: "free" | "pro" | "business" | "enterprise";

  // Billing
  billingCustomerId?: string;
  subscriptionId?: string;
  priceIds?: string[];
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd?: boolean;

  // Cached entitlements
  entitlements?: {
    monitorsMax: number;
    notificationChannelsMax: number;
    statusPageMax: number;
    checksIntervalMsMin: number;
    teamsMax: number;
    notificationsEnabled: boolean;
    retentionDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const orgSchema = new Schema<IOrg>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Subscription Info
    planKey: {
      type: String,
      enum: ["free", "pro", "business", "enterprise"],
      default: "free",
      required: true,
    },
    billingCustomerId: { type: String },
    subscriptionId: { type: String },
    priceIds: { type: [String], default: undefined },
    subscriptionStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled", "incomplete"],
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    trialEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean },
    entitlements: {
      monitorsMax: { type: Number },
      notificationChannelsMax: { type: Number },
      statusPageMax: { type: Number },
      checksIntervalMsMin: { type: Number },
      teamsMax: { type: Number },
      notificationsEnabled: { type: Boolean },
      retentionDays: { type: Number },
    },
  },
  { timestamps: true }
);

export const Org = mongoose.model<IOrg>("Org", orgSchema);
