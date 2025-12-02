import { Entitlements, Plans } from "@/types/entitlements.js";
import { Org } from "@/db/models/index.js";
import { DeploymentMode } from "@/utils/FeatureFlags.js";
import { config } from "@/config/index.js";

export interface IEntitlementsProvider {
  getForOrg(orgId: string): Promise<Entitlements>;
}

export class SaaSEntitlementsProvider implements IEntitlementsProvider {
  async getForOrg(orgId: string): Promise<Entitlements> {
    const org = await Org.findById(orgId).lean();

    const plan = org?.planKey ?? "free";
    switch (plan) {
      case "pro":
        return Plans.pro;
      case "business":
        return Plans.business;
      case "enterprise":
        return Plans.enterprise;
      default:
        return Plans.free;
    }
  }
}

export class SelfHostedEntitlementsProvider implements IEntitlementsProvider {
  async getForOrg(_orgId: string): Promise<Entitlements> {
    return Plans.unlimited;
  }
}

export class EntitlementsFactory {
  static create(): IEntitlementsProvider {
    const mode: DeploymentMode = config.DEPLOYMENT_MODE || "self_hosted";
    if (mode === "self_hosted") return new SelfHostedEntitlementsProvider();
    return new SaaSEntitlementsProvider();
  }
}
