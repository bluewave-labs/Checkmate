import { IUser, IUserProfile, User } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import { hashPassword } from "@/utils/JWTUtils.js";
import { object } from "joi";

const SERVICE_NAME = "UserService";
export interface IUserService {
  get(email: string): Promise<IUser>;
  getAllUsers(): Promise<IUser[]>;
}

class UserService implements IUserService {
  public SERVICE_NAME: string;
  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  async get(email: string): Promise<IUser> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    return user;
  }

  async update(userId: string, data: Partial<IUserProfile>): Promise<IUser> {
    let passwordHash = null;

    const updateData: Record<string, any> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.password !== undefined) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError("No valid fields to update", 400);
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      throw new ApiError("User not found", 404);
    }
    return updatedUser;
  }

  async getAllUsers(): Promise<IUser[]> {
    return await User.find();
  }
}

export default UserService;
