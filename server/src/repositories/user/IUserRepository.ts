import type { User } from "@/types/domain/index.js";
export interface IUserRepository {
  // create
  // single fetch
  findByEmail: (email: string) => Promise<User | null>;
  // collection fetch
  // update
  // delete
}
