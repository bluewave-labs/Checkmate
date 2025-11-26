import UserService from "../business/UserService.js";
import {
  IMonitor,
  Monitor,
  NotificationChannel,
  INotificationChannel,
  IIncident,
} from "@/db/models/index.js";
import {
  EmailService,
  SlackService,
  DiscordService,
  WebhookService,
} from "./NotificationServices/index.js";
import SettingsService from "@/services/system/SettingsService.js";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";
import type { IEmailTransport } from "./NotificationServices/Email.js";

const SERVICE_NAME = "NotificationService";
const logger = getChildLogger(SERVICE_NAME);

export interface ITestResult {
  channelName: string;
  channelUrl: string;
  channelType: string;
  sent: boolean;
}
export interface INotificationService {
  handleNotifications: (
    monitor: IMonitor,
    incident: IIncident
  ) => Promise<void>;
  testNotificationChannels: (
    monitorId: string,
    teamId: string
  ) => Promise<ITestResult[]>;
  testNotificationChannel: (
    notificationChannel: INotificationChannel
  ) => Promise<Boolean>;
  testEmailTransport: (transport: IEmailTransport) => Promise<boolean>;
}

class NotificationService implements INotificationService {
  public SERVICE_NAME: string;
  private emailService: EmailService;
  private slackService: SlackService;
  private discordService: DiscordService;
  private webhookService: WebhookService;
  private userService: UserService;

  constructor(userService: UserService, settingsService: SettingsService) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.userService = userService;
    this.emailService = new EmailService(userService, settingsService);
    this.slackService = new SlackService();
    this.discordService = new DiscordService();
    this.webhookService = new WebhookService();
  }

  handleNotifications = async (monitor: IMonitor, incident: IIncident) => {
    const notificationIds = monitor.notificationChannels || [];

    if (notificationIds.length === 0) {
      return;
    }

    const notificationChannels = await NotificationChannel.find({
      _id: { $in: notificationIds },
    });

    const tasks = notificationChannels.map((channel) =>
      this.sendForChannel(channel, monitor, incident)
    );

    const outcomes = await Promise.all(tasks);
    const succeeded = outcomes.filter(Boolean).length;
    const failed = outcomes.length - succeeded;

    if (failed > 0) {
      logger.warn(
        `Notification send completed with ${succeeded} success, ${failed} failure(s)`
      );
    }

    return;
  };

  private sendForChannel = async (
    channel: INotificationChannel,
    monitor: IMonitor,
    incident: IIncident
  ): Promise<boolean> => {
    try {
      switch (channel.type) {
        case "email": {
          const sent = await this.emailService.sendMessage(
            this.emailService.buildAlert(monitor, incident),
            channel
          );
          return Boolean(sent);
        }
        case "slack": {
          const sent = await this.slackService.sendMessage(
            this.slackService.buildAlert(monitor, incident),
            channel
          );
          return Boolean(sent);
        }
        case "discord": {
          const sent = await this.discordService.sendMessage(
            this.discordService.buildAlert(monitor, incident),
            channel
          );
          return Boolean(sent);
        }
        case "webhook": {
          const sent = await this.webhookService.sendMessage(
            this.webhookService.buildAlert(monitor, incident),
            channel
          );
          return Boolean(sent);
        }
        default: {
          logger.warn(`Unknown notification channel type: ${channel.type}`);
          return false;
        }
      }
    } catch (error) {
      logger.debug("Notification send failure", error);
      return false;
    }
  };

  private testNotification = async (
    channel: INotificationChannel,
    results: any[]
  ) => {
    switch (channel.type) {
      case "email":
        const sentEmail = await this.emailService.testMessage(channel);
        results.push({
          channelId: channel._id,
          channelName: channel.name,
          channelType: channel.type,
          channelUrl: channel.config?.emailAddress || "N/A",
          sent: sentEmail,
        });
        break;
      case "slack":
        const sentSlack = await this.slackService.testMessage(channel);
        results.push({
          channelId: channel._id,
          channelName: channel.name,
          channelType: channel.type,
          channelUrl: channel.config?.url || "N/A",
          sent: sentSlack,
        });
        break;
      case "discord":
        const sentDiscord = await this.discordService.testMessage(channel);
        results.push({
          channelId: channel._id,
          channelName: channel.name,
          channelType: channel.type,
          channelUrl: channel.config?.url || "N/A",
          sent: sentDiscord,
        });
        break;
      case "webhook":
        const sentWebhook = await this.webhookService.testMessage(channel);
        results.push({
          channelId: channel._id,
          channelName: channel.name,
          channelType: channel.type,
          channelUrl: channel.config?.url || "N/A",
          sent: sentWebhook,
        });
        break;
      default:
        logger.warn(`Unknown notification channel type: ${channel.type}`);
    }
    return results;
  };

  testNotificationChannels = async (monitorId: string, teamId: string) => {
    const monitor = await Monitor.findOne({
      _id: monitorId,
      teamId: teamId,
    });

    if (!monitor) {
      throw new ApiError("Monitor not found", 404);
    }

    const notificationIds = monitor.notificationChannels || [];
    const notificationChannels = await NotificationChannel.find({
      _id: { $in: notificationIds },
    }).lean();

    if (notificationChannels.length === 0) {
      return [];
    }

    const results: any[] = [];
    await Promise.all(
      notificationChannels.map((ch) => this.testNotification(ch, results))
    );
    const succeeded = results.filter((r) => r.sent).length;
    const failed = results.length - succeeded;
    if (failed > 0) {
      logger.warn(
        `Notification channel test completed with ${succeeded} success, ${failed} failure(s)`
      );
    }
    return results;
  };

  testNotificationChannel = async (
    notificationChannel: INotificationChannel
  ) => {
    const result: any[] = [];
    await this.testNotification(notificationChannel, result);
    if (result.length > 0) {
      return Boolean(result[0]?.sent);
    }
    return false;
  };

  testEmailTransport = async (transport: IEmailTransport) => {
    return this.emailService.testTransport(transport);
  };
}

export default NotificationService;
