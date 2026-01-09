import { INotificationChannel } from "@/db/models/index.js";
import type { Monitor, Incident } from "@/types/domain/index.js";

import { IMessageService, IAlert } from "./IMessageService.js";
import nodemailer, { Transporter } from "nodemailer";
import { config } from "@/config/index.js";
import UserService from "../../business/UserService.js";
import ApiError from "@/utils/ApiError.js";
import { SettingsService } from "@/services/index.js";
import { getChildLogger } from "@/logger/Logger.js";
import { transport } from "winston";
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
    content: { text?: string; html?: string },
  ) => Promise<boolean>;
  testTransport: (transport: IEmailTransport) => Promise<boolean>;
  rebuildTransport: (transport: IEmailTransport) => Promise<boolean>;
}

class EmailService implements IEmailService {
  public SERVICE_NAME = SERVICE_NAME;
  private transporter: Transporter | null;
  private userService: UserService;
  private settingsService: SettingsService;
  private from: string | null;

  constructor(userService: UserService, settingsService: SettingsService) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.userService = userService;
    this.settingsService = settingsService;
    this.transporter = null;
    this.from = null;
  }

  private hasEnvConfig = () => {
    return (
      config.SMTP_HOST !== "not_set" ||
      config.SMTP_PORT !== -1 ||
      config.SMTP_USER !== "not_set" ||
      config.SMTP_PASS !== "not_set"
    );
  };

  private buildSystemSettingsTransport = async (transport: IEmailTransport) => {
    const host = (transport.systemEmailHost ?? "").trim();
    const port =
      transport.systemEmailPort !== undefined &&
      transport.systemEmailPort !== null
        ? Number(transport.systemEmailPort)
        : undefined;
    const baseOptions = {
      port,
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
    this.from = transport.systemEmailAddress || null;
    return nodemailer.createTransport(transportOptions);
  };

  private buildEnvTransport = () => {
    this.from = config.SMTP_USER || null;
    return nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  };

  private buildTransport = async () => {
    if (this.hasEnvConfig()) {
      return this.buildEnvTransport();
    } else {
      const systemSettings = await this.settingsService.get();
      return this.buildSystemSettingsTransport(systemSettings);
    }
  };

  buildAlert = (monitor: Monitor, incident: Incident) => {
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

      if (this.transporter === null) {
        this.transporter = await this.buildTransport();
      }

      const res = await this.transporter.sendMail({
        from: `"Checkmate" <${this.from}>`,
        to: emails,
        subject: "Monitor Alert",
        text: JSON.stringify(alert, null, 2),
      });

      return true;
    } catch (error: any) {
      logger.error(error?.message || error);
      if (error?.code === "ECONNREFUSED") {
        throw new ApiError(
          "Could not connect to email server. Please check your SMTP settings.",
          503,
        );
      }
      if (error?.code === "EAUTH") {
        throw new ApiError(
          "Email authentication failed. Please check your SMTP credentials.",
          401,
        );
      }
      if (error?.code === "ESOCKET") {
        throw new ApiError(
          "Email server connection timed out. Please check your SMTP host and port.",
          503,
        );
      }
      throw new ApiError(
        error?.message || "Failed to send email notification",
        500,
      );
    }
  };

  testMessage = async (channel: INotificationChannel) => {
    return await this.sendMessage(
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
      channel,
    );
  };

  sendGeneric = async (
    to: string,
    subject: string,
    content: { text?: string; html?: string },
  ) => {
    try {
      if (this.transporter === null) {
        this.transporter = await this.buildTransport();
      }

      await this.transporter.sendMail({
        from: `"Checkmate" <${this.from}>`,
        to: to,
        subject: subject,
        text: content.text,
        html: content.html,
      });
      return true;
    } catch (error) {
      throw error;
    }
  };

  testTransport = async (transport: IEmailTransport) => {
    if (this.hasEnvConfig()) {
      throw new ApiError(
        "Cannot test transport when environment SMTP settings are set",
        400,
      );
    }
    const testTransport = await this.buildSystemSettingsTransport(transport);
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

  rebuildTransport = async (transport: IEmailTransport) => {
    this.transporter = await this.buildSystemSettingsTransport(transport);
    this.from = transport.systemEmailAddress || null;
    return true;
  };
}

export default EmailService;
