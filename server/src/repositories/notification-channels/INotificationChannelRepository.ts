import type { NotificationChannel } from "@/types/domain/index.js";

export interface INotificationChannelRepository {
  // create
  create: (data: Partial<NotificationChannel>) => Promise<NotificationChannel>;
  // single fetch
  findById: (
    notificationChannelId: string,
    teamId: string
  ) => Promise<NotificationChannel | null>;
  // collection fetch
  findByTeamId: (teamId: string) => Promise<NotificationChannel[]>;
  // update
  update: (
    notificationChannelId: string,
    teamid: string,
    data: Partial<NotificationChannel>
  ) => Promise<NotificationChannel | null>;
  // delete
  deleteById: (
    notificationChannelId: string,
    teamId: string
  ) => Promise<boolean>;
}
