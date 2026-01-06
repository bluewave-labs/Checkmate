import { PlanKey } from "@/types/entitlements.js";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface Org {
  id: string;
  name: string;
  ownerId: string;

  // Entitlements & plan
  planKey: "free" | "pro" | "business" | "enterprise";

  // Billing
  billingCustomerId?: string;
  subscriptionId?: string;
  priceId: string;
  priceIds?: string[];
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;

  // Cached entitlements
  entitlements: {
    plan: PlanKey;
    monitorsMax: number;
    notificationChannelsMax: number;
    statusPagesMax: number;
    checksIntervalMsMin: number;
    teamsMax: number;
    notificationsEnabled: boolean;
    retentionDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
