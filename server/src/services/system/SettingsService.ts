import { ISystemSettings, SystemSettings } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "SettingsService";
export interface ISettingsService {
  get: () => Promise<ISystemSettings>;
  update: (settings: Partial<ISystemSettings>) => Promise<ISystemSettings>;
}

class SettingsService implements ISettingsService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
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

  update = async (
    payload: Partial<ISystemSettings>
  ): Promise<ISystemSettings> => {
    const { _id, createdAt, updatedAt, ...updates } = payload as Record<
      string,
      unknown
    >;

    const settings = await SystemSettings.findOneAndUpdate(
      { _id: "global" },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!settings) {
      throw new ApiError("Unable to update system settings", 500);
    }

    return settings;
  };
}

export default SettingsService;
