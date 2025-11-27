import { ISystemSettings, SystemSettings } from "@/db/models/index.js";
import mongoose from "mongoose";
import ApiError from "@/utils/ApiError.js";
import { EmailService } from "@/services/index.js";
const SERVICE_NAME = "SettingsService";
export interface ISettingsService {
  get: () => Promise<ISystemSettings>;
  updateEmailSettings: (
    settings: Partial<ISystemSettings>
  ) => Promise<ISystemSettings>;
  updateRetentionPolicy: (retentionDays: number) => Promise<number>;
}

class SettingsService implements ISettingsService {
  public SERVICE_NAME: string;
  private emailService!: EmailService;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  setEmailService(emailService: EmailService) {
    this.emailService = emailService;
  }

  get = async (): Promise<ISystemSettings> => {
    let settings = await SystemSettings.findById("global").select(
      "-_id -__v -createdAt -updatedAt"
    );

    if (!settings) {
      await SystemSettings.create({ _id: "global" });
    }

    settings = await SystemSettings.findById("global").select(
      "-_id -__v -createdAt -updatedAt"
    );

    if (!settings) {
      throw new ApiError("Unable to load system settings", 500);
    }

    return settings;
  };

  updateEmailSettings = async (
    payload: Partial<ISystemSettings>
  ): Promise<ISystemSettings> => {
    const allFields = [
      "systemEmailHost",
      "systemEmailPort",
      "systemEmailAddress",
      "systemEmailPassword",
      "systemEmailUser",
      "systemEmailConnectionHost",
      "systemEmailTLSServername",
      "systemEmailSecure",
      "systemEmailPool",
      "systemEmailIgnoreTLS",
      "systemEmailRequireTLS",
      "systemEmailRejectUnauthorized",
    ] as const;

    const { _id, createdAt, updatedAt, ...incoming } = payload as Record<
      string,
      unknown
    >;

    const updateDoc: {
      $set?: Record<string, unknown>;
      $unset?: Record<string, 1>;
    } = {};

    for (const field of allFields) {
      if (Object.prototype.hasOwnProperty.call(incoming, field)) {
        updateDoc.$set ??= {};
        updateDoc.$set[field] = incoming[field];
      } else {
        updateDoc.$unset ??= {};
        updateDoc.$unset[field] = 1;
      }
    }

    const settings = await SystemSettings.findOneAndUpdate(
      { _id: "global" },
      updateDoc,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!settings) {
      throw new ApiError("Unable to update system settings", 500);
    }

    this.emailService.rebuildTransport(settings);

    return settings;
  };

  updateRetentionPolicy = async (retentionDays: number) => {
    const settings = await SystemSettings.findOneAndUpdate(
      { _id: "global" },
      { $set: { checksRetentionDays: retentionDays } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!settings) {
      throw new ApiError("Unable to update system settings", 500);
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new ApiError("Database not initialized", 500);
    }

    const seconds = Math.floor(retentionDays * 24 * 60 * 60);

    const cmdResult = await db.command({
      collMod: "checks",
      expireAfterSeconds: seconds,
    });

    if (!cmdResult || (cmdResult as any).ok !== 1) {
      throw new ApiError("Failed to apply TTL to checks collection", 500);
    }

    const list = (await db.command({
      listCollections: 1,
      filter: { name: "checks" },
    })) as unknown as {
      cursor?: {
        firstBatch?: Array<{
          options?: { expireAfterSeconds?: number | string };
        }>;
      };
      ok?: 1 | 0;
    };
    const expireOption =
      list?.cursor?.firstBatch?.[0]?.options?.expireAfterSeconds;
    const appliedSeconds =
      typeof expireOption === "number" ? expireOption : Number(expireOption);

    if (!appliedSeconds || appliedSeconds !== seconds) {
      throw new ApiError(
        "TTL verification failed: expireAfterSeconds not applied",
        500
      );
    }

    return retentionDays;
  };
}

export default SettingsService;
