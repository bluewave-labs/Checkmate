import { Org } from "@/types/domain/index.js";

export interface IOrgRepository {
  // create
  create(orgData: Partial<Org>): Promise<Org>;
  // single fetch
  // collection fetch
  // update
  // delete
}
