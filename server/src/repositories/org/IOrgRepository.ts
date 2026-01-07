import { Org } from "@/types/domain/index.js";

export interface IOrgRepository {
  // create
  create(orgData: Partial<Org>): Promise<Org>;
  // single fetch
  findById(orgId: string): Promise<Org | null>;
  // collection fetch
  // update
  updateById(orgId: string, orgData: Partial<Org>): Promise<Org | null>;
  // delete
  deleteById(orgId: string): Promise<boolean>;
}
