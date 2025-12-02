export const PlanKeys = [
  "free",
  "pro",
  "business",
  "enterprise",
  "unlimited",
] as const;

export type PlanKey = (typeof PlanKeys)[number];

export interface Entitlements {
  plan: PlanKey;
  monitorsMax: number;
  notificationChannelsMax: number;
  statusPagesMax: number;
  checksIntervalMsMin: number;
  teamsMax: number;
  notificationsEnabled: boolean;
  retentionDays: number;
  price?: number;
}

export const Plans: Record<PlanKey, Entitlements> = {
  free: {
    plan: "free",
    monitorsMax: 3,
    notificationChannelsMax: 2,
    statusPagesMax: 1,
    checksIntervalMsMin: 60_000,
    teamsMax: 1,
    notificationsEnabled: true,
    retentionDays: 30,
  },
  pro: {
    plan: "pro",
    monitorsMax: 25,
    notificationChannelsMax: 5,
    statusPagesMax: 5,
    checksIntervalMsMin: 30_000,
    teamsMax: 5,
    notificationsEnabled: true,
    retentionDays: 90,
  },
  business: {
    plan: "business",
    monitorsMax: 50,
    notificationChannelsMax: 10,
    statusPagesMax: 20,
    checksIntervalMsMin: 15_000,
    teamsMax: 10,
    notificationsEnabled: true,
    retentionDays: 180,
  },
  enterprise: {
    plan: "enterprise",
    monitorsMax: 100,
    notificationChannelsMax: 20,
    statusPagesMax: 100,
    checksIntervalMsMin: 10_000,
    teamsMax: 20,
    notificationsEnabled: true,
    retentionDays: 365,
  },
  unlimited: {
    plan: "unlimited",
    monitorsMax: Number.MAX_SAFE_INTEGER,
    notificationChannelsMax: Number.MAX_SAFE_INTEGER,
    statusPagesMax: Number.MAX_SAFE_INTEGER,
    checksIntervalMsMin: 1000,
    teamsMax: Number.MAX_SAFE_INTEGER,
    notificationsEnabled: true,
    retentionDays: 365,
  },
};
