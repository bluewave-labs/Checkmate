import {
  IMonitor,
  INotificationChannel,
  IIncident,
} from "@/db/models/index.js";
import { IMessageService, IAlert } from "./IMessageService.js";
import nodemailer, { Transporter } from "nodemailer";
import { config } from "@/config/index.js";
import UserService from "../../business/UserService.js";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";
const SERVICE_NAME = "EmailService";
const logger = getChildLogger(SERVICE_NAME);

export interface IEmailTransport {
  systemEmailHost?: string;
  systemEmailPort?: number;
  systemEmailAddress?: string;
  systemEmailPassword?: string;
  systemEmailUser?: string;
  systemEmailConnectionHost?: string;
  systemEmailTLSServername?: string;
  systemEmailSecure: boolean;
  systemEmailPool: boolean;
  systemEmailIgnoreTLS: boolean;
  systemEmailRequireTLS: boolean;
  systemEmailRejectUnauthorized: boolean;
}

export interface IEmailService extends IMessageService {
  sendGeneric: (
    to: string,
    subject: string,
    content: string
  ) => Promise<boolean>;
  testTransport: (transport: IEmailTransport) => Promise<boolean>;
}

class EmailService implements IEmailService {
  public SERVICE_NAME = SERVICE_NAME;
  private transporter: Transporter;
  private userService: UserService;

  constructor(userService: UserService) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.userService = userService;
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

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
    try {
      const users = await this.userService.getAllUsers();
      const emails = users.map((u) => u.email).join(",");

      if (!emails || emails.length === 0) {
        throw new ApiError("No user emails found", 500);
      }

      await this.transporter.sendMail({
        from: `"Checkmate" <${config.SMTP_USER}>`,
        to: emails,
        subject: "Monitor Alert",
        text: JSON.stringify(alert, null, 2),
      });
      return true;
    } catch (error) {
      return false;
    }
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

  sendGeneric = async (to: string, subject: string, content: string) => {
    try {
      await this.transporter.sendMail({
        from: `"Checkmate" <${config.SMTP_USER}>`,
        to: to,
        subject: subject,
        text: content,
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  testTransport = async (transport: IEmailTransport) => {
    const host = (transport.systemEmailHost ?? "").trim();
    const baseOptions = {
      port: Number(transport.systemEmailPort),
      secure: transport.systemEmailSecure,
      auth: {
        user: transport.systemEmailUser || transport.systemEmailAddress,
        pass: transport.systemEmailPassword,
      },
      name: transport.systemEmailConnectionHost || undefined,
      connectionTimeout: 5000,
      tls: {
        rejectUnauthorized: transport.systemEmailRejectUnauthorized,
        ignoreTLS: transport.systemEmailIgnoreTLS,
        requireTLS: transport.systemEmailRequireTLS,
        servername: transport.systemEmailTLSServername,
      },
    };

    const transportOptions = transport.systemEmailPool
      ? {
          ...baseOptions,
          pool: true,
          host,
        }
      : {
          ...baseOptions,
          host: host || undefined,
        };

    const testTransport = nodemailer.createTransport(transportOptions);
    try {
      await testTransport.sendMail({
        from: `"Checkmate Test" <${transport.systemEmailAddress}>`,
        to: transport.systemEmailUser || transport.systemEmailAddress,
        subject: "SMTP transport test",
        text: "This is a transport verification message.",
      });
      return true;
    } catch (error: any) {
      logger.error(error);
      throw new ApiError(`Email transport test failed`, 400);
    }
  };
}

export default EmailService;
