import type { IStatsBase } from "@/types/domain/index.js";

import type {
  IInfraCpu,
  IInfraDiskEntry,
  IInfraHost,
  IInfraMemory,
  IInfraNetEntry,
  IPageSpeedMetrics,
} from "@/types/domain/index.js";

export interface IStatsDaily extends IStatsBase, IPageSpeedMetrics {
  cpu?: IInfraCpu;
  memory?: IInfraMemory;
  disk?: IInfraDiskEntry[];
  host?: IInfraHost;
  net?: IInfraNetEntry[];
  // Docker rollups
  dockerRunningPercent?: number;
  dockerHealthyPercent?: number;
  dockerRunningContainers?: number;
  dockerHealthyContainers?: number;
  dockerTotalContainers?: number;
}
