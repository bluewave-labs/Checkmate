import { config } from "@/config/index.js";
import { PERMISSIONS } from "@/types/permissions.js";
export type DeploymentMode = "saas" | "self_hosted";

const CURRENT_MODE = config.DEPLOYMENT_MODE;

const isSaaS = () => CURRENT_MODE === "saas";
const isSelfHosted = () => CURRENT_MODE === "self_hosted";

const FeatureFlags = {
  mode: CURRENT_MODE,
  isSaaS,
  isSelfHosted,
  getDiagnosticPermission(): string[] {
    return isSaaS() ? [PERMISSIONS.master] : [PERMISSIONS.diagnostic.read];
  },
  getSetRetentionPermission(): string[] {
    return isSaaS() ? [PERMISSIONS.master] : [PERMISSIONS.checks.write];
  },
};

export { FeatureFlags };
