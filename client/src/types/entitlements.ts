export type EntitlemenstKey = keyof Entitlements;

export interface Entitlements {
  plan: string;
  monitorsMax: number;
  notificationChannelsMax: number;
  statusPagesMax: number;
  checksIntervalMsMin: number;
  teamsMax: number;
  notificationsEnabled: boolean;
  retentionDays: number;
}
