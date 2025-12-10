import type { DeploymentMode } from "@/types/env";

declare global {
  interface Window {
    __ENV?: Record<string, unknown>;
  }
}

export interface IEnvConfig {
  HOST: string;
  GLOBAL_REFRESH: number;
  API_BASE_URL: string;
  DEPLOYMENT_MODE: DeploymentMode;
}

const RT = (typeof window !== "undefined" && window.__ENV) || undefined;

const requireKey = (key: string): string => {
  if (!RT || !(key in RT)) {
    throw new Error(`Missing runtime config: ${key}`);
  }
  const value = RT[key];
  if (value == null || String(value).trim() === "") {
    throw new Error(`Invalid runtime config: ${key}`);
  }
  return String(value);
};

const HOST = requireKey("APP_HOST");
const API_BASE_URL = requireKey("APP_API_BASE_URL");
const GLOBAL_REFRESH_STR = requireKey("GLOBAL_REFRESH");
const GLOBAL_REFRESH_NUM = Number(GLOBAL_REFRESH_STR);
if (!Number.isFinite(GLOBAL_REFRESH_NUM)) {
  throw new Error(`GLOBAL_REFRESH must be a number, received: ${GLOBAL_REFRESH_STR}`);
}
const DEPLOYMENT_MODE_STR = requireKey("APP_DEPLOYMENT_MODE").toLowerCase();
if (DEPLOYMENT_MODE_STR !== "saas" && DEPLOYMENT_MODE_STR !== "self_hosted") {
  throw new Error(`APP_DEPLOYMENT_MODE must be 'saas' or 'self_hosted', received: ${DEPLOYMENT_MODE_STR}`);
}
const DEPLOYMENT_MODE = DEPLOYMENT_MODE_STR as DeploymentMode;

export const config: IEnvConfig = {
  HOST,
  GLOBAL_REFRESH: GLOBAL_REFRESH_NUM,
  API_BASE_URL,
  DEPLOYMENT_MODE,
};
