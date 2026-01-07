import { type IOrg, Org } from "@/db/models/index.js";
import type { IOrgRepository } from "@/repositories/index.js";
import { Org as OrgEntity } from "@/types/domain/index.js";

class MongoOrgRepository implements IOrgRepository {
  toEntity = (doc: IOrg): OrgEntity => {
    return {
      id: doc._id.toString(),
      name: doc.name.toString(),
      ownerId: doc.ownerId.toString(),
      planKey: doc.planKey,

      // Billing
      billingCustomerId: doc.billingCustomerId,
      subscriptionId: doc.subscriptionId,
      priceId: doc.priceId,
      priceIds: doc.priceIds,
      subscriptionStatus: doc.subscriptionStatus,
      currentPeriodStart: doc.currentPeriodStart,
      currentPeriodEnd: doc.currentPeriodEnd,

      entitlements: doc.entitlements,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  create = async (orgData: Partial<OrgEntity>) => {
    const org = await Org.create(orgData);
    return this.toEntity(org);
  };

  findById = async (orgId: string) => {
    const org = await Org.findById(orgId);
    if (!org) return null;
    return this.toEntity(org);
  };

  updateById = async (orgId: string, orgData: Partial<OrgEntity>) => {
    const updated = await Org.findOneAndUpdate(
      { _id: orgId },
      { $set: orgData },
      { new: true }
    );
    if (!updated) return null;
    return this.toEntity(updated);
  };

  deleteById = async (orgId: string) => {
    const result = await Org.deleteOne({ _id: orgId });
    return result.deletedCount === 1;
  };
}

export default MongoOrgRepository;
