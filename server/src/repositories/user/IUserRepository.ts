import type { User } from "@/types/domain/index.js";
export interface IUserRepository {
  // create
  create(userData: Partial<User>): Promise<User>;
  // single fetch
  findByEmail: (email: string) => Promise<User | null>;
  // collection fetch
  // update
  // delete
}
