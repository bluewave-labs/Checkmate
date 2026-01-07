import type { User as UserEntity } from "@/types/domain/index.js";
import { IUserRepository } from "@/repositories/index.js";
import { User } from "@/db/models/index.js";
import type { IUser } from "@/db/models/index.js";

class MongoUserRepository implements IUserRepository {
  private toEntity = (user: IUser): UserEntity => {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      passwordHash: user.passwordHash,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  };

  create = async (userData: Partial<UserEntity>) => {
    const user = await User.create(userData);
    return this.toEntity(user);
  };

  findByEmail = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) return null;
    return this.toEntity(user);
  };

  findByUserId = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) return null;
    return this.toEntity(user);
  };

  updateById = async (userId: string, updateData: Partial<UserEntity>) => {
    const result = await User.findOneAndUpdate(
      { _id: userId },
      { $set: updateData },
      { new: true }
    );
    if (!result) return null;
    return this.toEntity(result);
  };

  deleteById = async (userId: string) => {
    const result = await User.deleteOne({ _id: userId });
    return result.deletedCount === 1;
  };
}

export default MongoUserRepository;
