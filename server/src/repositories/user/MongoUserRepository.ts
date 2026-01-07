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
}

export default MongoUserRepository;
