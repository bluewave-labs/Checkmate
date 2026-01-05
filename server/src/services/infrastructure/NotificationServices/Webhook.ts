import { INotificationChannel, IIncident } from "@/db/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import ApiError from "@/utils/ApiError.js";
import got from "got";
import { getChildLogger } from "@/logger/Logger.js";
import type { Monitor } from "@/types/domain/index.js";

const SERVICE_NAME = "WebhookService";
const logger = getChildLogger(SERVICE_NAME);
class WebhookService implements IMessageService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  buildAlert = (monitor: Monitor, incident: IIncident) => {
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
      await got.post(notificationUrl, { json: { ...alert } });
    } catch (error) {
      logger.warn("Failed to send webhook notification:", error);
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

export default WebhookService;
