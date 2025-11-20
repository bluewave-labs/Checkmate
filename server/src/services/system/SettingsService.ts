import { ISystemSettings, SystemSettings } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import { EmailService } from "@/services/index.js";
const SERVICE_NAME = "SettingsService";
export interface ISettingsService {
  get: () => Promise<ISystemSettings>;
  updateEmailSettings: (
    settings: Partial<ISystemSettings>
  ) => Promise<ISystemSettings>;
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
}

export default SettingsService;
