export const ChannelTypes = ["email", "slack", "discord", "webhook"] as const;
export type ChannelType = (typeof ChannelTypes)[number];

export interface INotificationChannelConfig {
  url?: string; // For webhook, slack, discord
  emailAddress?: string; // For email
}

export interface INotificationChannel {
  _id: string;
  orgId: string;
  teamId: string;
  name: string;
  type: ChannelType;
  config: INotificationChannelConfig;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
