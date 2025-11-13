import crypto from "node:crypto";
import { RecoveryToken, IRecoveryToken } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import { Types } from "mongoose";
const SERVICE_NAME = "RecoveryService";

export interface IRecoveryService {
  create: (userId: Types.ObjectId) => Promise<string>;
  get: (token: string) => Promise<IRecoveryToken>;
  delete: (id: string) => Promise<boolean>;
}

class RecoveryService implements IRecoveryService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (userId: Types.ObjectId) => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await RecoveryToken.create({
      userId,
      tokenHash,
    });
    return token;
  };

  get = async (token: string) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const recoveryToken = await RecoveryToken.findOne({ tokenHash });
    if (!recoveryToken) {
      throw new ApiError("Recovery token not found", 404);
    }

    if (recoveryToken.expiry.getTime() <= Date.now()) {
      throw new ApiError("Recovery token expired", 400);
    }

    return recoveryToken;
  };

  delete = async (id: string) => {
    const result = await RecoveryToken.deleteOne({ _id: id });
    if (!result.deletedCount) {
      throw new ApiError("Recovery token not found", 404);
    }
    return result.deletedCount === 1;
  };
}

export default RecoveryService;
