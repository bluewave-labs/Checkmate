import {
  IMonitor,
  INotificationChannel,
  IIncident,
} from "@/db/models/index.js";
import { IAlert, IMessageService } from "./IMessageService.js";
import got from "got";

import { getChildLogger } from "@/logger/Logger.js";
const SERVICE_NAME = "SlackService";
const logger = getChildLogger(SERVICE_NAME);
class SlackService implements IMessageService {
  public SERVICE_NAME = SERVICE_NAME;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  private toSlackBlocks = (alert: IAlert) => {
    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Status Alert",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Monitor name:* ${alert.name}`,
        },
      },

      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Status:* ${alert.status}`,
        },
      },

      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*URL:* ${alert.url}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `resolved: ${alert.resolved ? "Yes" : "No"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Resolution Type: ${alert.resolutionType || "N/A"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Resolution note: ${alert.resolutionNote || "N/A"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Checked at:* ${alert?.checkTime?.toISOString() || "N/A"}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Checked at:* ${alert?.checkTime?.toISOString() || "N/A"}`,
        },
      },

      {
        type: "divider",
      },

      ...(alert.details
        ? Object.entries(alert.details).map(([key, value]) => ({
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*${key}:* ${value}`,
              },
            ],
          }))
        : []),

      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `*Alert generated at:* ${
              alert?.alertTime?.toISOString() || "N/A"
            }`,
          },
        ],
      },
    ];
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
      throw new Error("Webhook URL not configured");
    }

    try {
      const payload = {
        text: "Status Alert",
        blocks: this.toSlackBlocks(alert),
      };
      await got.post(notificationUrl, { json: payload });
    } catch (error) {
      logger.warn("Error sending Slack message:", error);
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

export default SlackService;
