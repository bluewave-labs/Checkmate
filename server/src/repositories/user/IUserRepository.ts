import type { User } from "@/types/domain/index.js";
export interface IUserRepository {
  // create
  create(userData: Partial<User>): Promise<User>;
  // single fetch
  findByEmail: (email: string) => Promise<User | null>;
  findByUserId: (userId: string) => Promise<User | null>;
  // collection fetch
  // update
  updateById: (
    userId: string,
    updateData: Partial<User>
  ) => Promise<User | null>;
  // delete
  deleteById(userId: string): Promise<boolean>;
}
