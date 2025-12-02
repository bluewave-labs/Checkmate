import type { DeploymentMode } from "@/types/env";

export interface IEnvConfig {
  HOST: string;
  GLOBAL_REFRESH: number;
  API_BASE_URL: string;
  DEPLOYMENT_MODE: DeploymentMode;
}

const rawRefresh = import.meta.env.VITE_APP_GLOBAL_REFRESH;
const parsedRefresh = Number(rawRefresh);
const GLOBAL_REFRESH = Number.isFinite(parsedRefresh) ? parsedRefresh : 60000;

const rawMode = import.meta.env.VITE_APP_DEPLOYMENT_MODE as
  | DeploymentMode
  | string
  | undefined;
const DEPLOYMENT_MODE: DeploymentMode =
  rawMode === "saas" || rawMode === "self_hosted" ? (rawMode as DeploymentMode) : "self_hosted";

export const config: IEnvConfig = {
  HOST: import.meta.env.VITE_APP_HOST || "http://localhost:5173",
  GLOBAL_REFRESH,
  API_BASE_URL:
    import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:52345/api/v1",
  DEPLOYMENT_MODE,
};
