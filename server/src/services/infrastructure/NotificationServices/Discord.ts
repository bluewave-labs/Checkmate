import {
  IMonitor,
  INotificationChannel,
  IIncident,
} from "@/db/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import got from "got";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";
const SERVICE_NAME = "DiscordService";
const logger = getChildLogger(SERVICE_NAME);
class DiscordService implements IMessageService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  private toDiscordEmbeds = (alert: IAlert) => {
    return {
      color: alert.status === "up" ? 65280 : 16711680,
      title: `Monitor name: ${alert.name}`,
      description: `Status: **${alert.status}**`,
      fields: [
        {
          name: "Url",
          value: alert.url,
        },
        {
          name: "Checked at",
          value: alert.checkTime ? alert.checkTime.toISOString() : "N/A",
        },
        {
          name: "Resolved",
          value: alert.resolved ? "Yes" : "No",
        },
        {
          name: "Resolution type",
          value: alert.resolutionType || "N/A",
        },
        {
          name: "Resolution note",
          value: alert.resolutionNote || "N/A",
        },
        { name: "Alert time", value: alert.alertTime.toISOString() },
        ...(alert.details
          ? Object.entries(alert.details).map(([key, value]) => ({
              name: key,
              value,
            }))
          : []),
      ],
    };
  };

  buildAlert = (monitor: IMonitor, incident: IIncident) => {
    const name = monitor?.name || "Unnamed monitor";
    const monitorStatus = monitor?.status || "unknown status";
    const url = monitor?.url || "no URL";
    const checkTime = monitor?.lastCheckedAt || null;
    const alertTime = new Date();
    return {
      name,
      url,
      status: monitorStatus,
      resolved: incident.resolved,
      resolutionType: incident.resolutionType,
      resolvedBy: incident.resolvedBy?.toString(),
      resolutionNote: incident.resolutionNote,
      checkTime,
      alertTime,
    };
  };

  sendMessage = async (alert: IAlert, channel: INotificationChannel) => {
    const notificationUrl = channel?.config?.url;
    if (!notificationUrl) {
      throw new ApiError("Webhook URL not configured", 400);
    }

    try {
      const payload = {
        content: "Status Alert",
        embeds: [this.toDiscordEmbeds(alert)],
      };
      await got.post(notificationUrl, { json: payload });
    } catch (error) {
      logger.warn("Failed to send Discord message", error);
      return false;
    }

    return true;
  };

  testMessage = async (channel: INotificationChannel) => {
    return this.sendMessage(
      {
        name: "This is a test",
        url: "Test URL",
        status: "Test status",
        checkTime: new Date(),
        alertTime: new Date(),
        resolved: true,
        resolutionType: "auto",
        resolvedBy: "system",
        resolutionNote: "This is a test message",
      },
      channel
    );
  };
}

export default DiscordService;
