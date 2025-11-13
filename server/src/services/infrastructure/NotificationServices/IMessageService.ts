import {
  IMonitor,
  INotificationChannel,
  IIncident,
  ResolutionType,
} from "@/db/models/index.js";

export interface IAlert {
  name: string;
  url: string;
  status: string;
  resolved: boolean;
  resolutionType: ResolutionType | undefined;
  resolvedBy?: string | undefined;
  resolutionNote?: string | undefined;
  details?: Record<string, string>;
  checkTime: Date | null;
  alertTime: Date;
}
export interface IMessageService {
  buildAlert: (monitor: IMonitor, incident: IIncident) => IAlert;
  sendMessage: (
    alert: IAlert,
    channel: INotificationChannel
  ) => Promise<boolean>;
  testMessage: (channel: INotificationChannel) => Promise<boolean>;
}
