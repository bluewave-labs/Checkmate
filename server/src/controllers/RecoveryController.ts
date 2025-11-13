import { Request, Response, NextFunction } from "express";
import {
  AuthService,
  RecoveryService,
  EmailService,
} from "@/services/index.js";
import ApiError from "@/utils/ApiError.js";
import { User } from "@/db/models/index.js";
import { config } from "@/config/index.js";
import { encode } from "@/utils/JWTUtils.js";

import { getChildLogger } from "@/logger/Logger.js";
const logger = getChildLogger("RecoveryController");

export interface IRecoveryController {
  requestRecovery: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
  resetPassword: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>;
}

class RecoveryController implements IRecoveryController {
  private recoveryService: RecoveryService;
  private authService: AuthService;
  private emailService: EmailService;
  constructor(
    recoveryService: RecoveryService,
    authService: AuthService,
    emailService: EmailService
  ) {
    this.recoveryService = recoveryService;
    this.authService = authService;
    this.emailService = emailService;
  }

  requestRecovery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).lean();

      if (user) {
        try {
          const recoveryToken = await this.recoveryService.create(user._id);
          // Don't wait for email to be sent
          this.emailService
            .sendGeneric(
              user.email,
              "Password Recovery",
              `Your recovery link is: ${config.ORIGIN}/recovery/${recoveryToken}`
            )
            .catch((error) => {
              logger.error(error);
            });
        } catch (error) {
          // These should not be propagated to the user
          logger.error(error);
        }
      }
      res.status(200).json({ message: "OK" });
    } catch (error: any) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      const recoveryToken = await this.recoveryService.get(token);
      if (!recoveryToken) {
        throw new ApiError("Invalid recovery token", 400);
      }
      await this.authService.changePassword(recoveryToken.userId, password);
      await this.recoveryService.delete(recoveryToken._id);

      const user = await User.findById(recoveryToken.userId);
      if (!user) {
        throw new ApiError("User not found", 404);
      }
      const { tokenizedUser, returnableUser } = await this.authService.login({
        email: user.email,
        password,
      });

      const userToken = encode(tokenizedUser);

      res.cookie("token", userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      res.status(200).json({
        message: "Reset successful",
        data: returnableUser,
      });
    } catch (error: any) {
      next(error);
    }
  };
}

export default RecoveryController;
