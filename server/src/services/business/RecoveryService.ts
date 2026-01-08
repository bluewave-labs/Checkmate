import crypto from "node:crypto";
import ApiError from "@/utils/ApiError.js";
import { IRecoveryTokenRepistory } from "@/repositories/index.js";
import type { RecoveryToken } from "@/types/domain/index.js";
const SERVICE_NAME = "RecoveryService";

export interface IRecoveryService {
  create: (userId: string) => Promise<string>;
  get: (token: string) => Promise<RecoveryToken>;
  delete: (id: string) => Promise<boolean>;
}

class RecoveryService implements IRecoveryService {
  public SERVICE_NAME: string;

  private recoveryTokenRepository: IRecoveryTokenRepistory;
  constructor(recoveryTokenRepository: IRecoveryTokenRepistory) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.recoveryTokenRepository = recoveryTokenRepository;
  }

  create = async (userId: string) => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const didCreate = await this.recoveryTokenRepository.create(
      userId,
      tokenHash
    );
    if (!didCreate) {
      throw new ApiError("Failed to create recovery token", 500);
    }

    return token;
  };

  get = async (token: string) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const recoveryToken = await this.recoveryTokenRepository.findByTokenHash(
      tokenHash
    );
    if (!recoveryToken) {
      throw new ApiError("Recovery token not found", 404);
    }

    if (recoveryToken.expiry.getTime() <= Date.now()) {
      throw new ApiError("Recovery token expired", 400);
    }

    return recoveryToken;
  };

  delete = async (id: string) => {
    const didDelete = await this.recoveryTokenRepository.deleteByid(id);
    if (!didDelete) {
      throw new ApiError("Recovery token not found", 404);
    }
    return didDelete;
  };
}

export default RecoveryService;
