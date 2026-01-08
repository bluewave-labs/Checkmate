export const ChannelTypes = ["email", "slack", "discord", "webhook"] as const;
export type ChannelType = (typeof ChannelTypes)[number];

export interface NotificationChannelConfig {
  url?: string; // For webhook, slack, discord
  emailAddress?: string; // For email
}

export interface NotificationChannel {
  id: string;
  orgId: string;
  teamId: string;
  name: string;
  type: ChannelType;
  config: NotificationChannelConfig;
  isActive: boolean | unknown;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
