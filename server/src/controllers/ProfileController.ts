import { Request, Response, NextFunction } from "express";
import type { IUser } from "@/db/models/index.js";
import { UserService } from "@/services/index.js";
import ApiError from "@/utils/ApiError.js";

export interface IProfileController {
  get(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
}

class ProfileController {
  private userService: UserService;
  constructor(userService: UserService) {
    this.userService = userService;
  }

  private parseUser(user: IUser): Partial<IUser> {
    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // TODO convert to get by id
      const user = await this.userService.get(userContext.email);
      if (!user) {
        throw new ApiError("User not found", 404);
      }

      res.status(200).json({
        message: "OK",
        data: this.parseUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userContext = req.user;
      if (!userContext) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updateData = req.body;

      const updatedUser = await this.userService.update(
        userContext.sub,
        updateData
      );

      res
        .status(200)
        .json({ message: "OK", data: this.parseUser(updatedUser) });
    } catch (error: any) {
      next(error);
    }
  };
}
export default ProfileController;
