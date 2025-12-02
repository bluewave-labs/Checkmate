/// <reference types="vite/client" />
import type { DeploymentMode } from "@/types/env";
interface ImportMetaEnv {
  readonly VITE_APP_HOST?: string;
  readonly VITE_APP_GLOBAL_REFRESH?: string;
  readonly VITE_APP_API_BASE_URL?: string;
  readonly VITE_APP_DEPLOYMENT_MODE?: DeploymentMode;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
