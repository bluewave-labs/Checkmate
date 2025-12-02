export type PlanKey = "free" | "pro" | "business" | "enterprise" | "unlimited";

export interface Entitlements {
  plan: PlanKey;
  price?: number;
  monitorsMax: number;
  notificationChannelsMax: number;
  statusPagesMax: number;
  checksIntervalMsMin: number;
  teamsMax: number;
  notificationsEnabled: boolean;
  retentionDays: number;
}
