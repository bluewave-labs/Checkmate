import type { IMongoUser } from "@/types/user";
import type { IMonitor } from "@/types/monitor";

export interface IIncident {
  _id: string;
  monitorId: IMonitor;
  teamId: string;
  startedAt: string;
  startCheck: string;
  resolved: boolean;
  endedAt?: string;
  endCheck?: string;
  resolvedBy?: IMongoUser;
  resolutionType?: string;
  resolutionNote?: string;
}
