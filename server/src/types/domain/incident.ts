export const ResolutionTypes = ["auto", "manual"] as const;
export type ResolutionType = (typeof ResolutionTypes)[number];
import type { MonitorType, MonitorStatus } from "@/types/domain/index.js";
export interface Incident {
  id: string;
  monitorId: string;
  teamId: string;
  startedAt: Date;
  startCheck: string;
  endedAt?: Date;
  endCheck?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolutionType?: ResolutionType;
  resolutionNote?: string;
}

export interface IncidentWithDetails extends Incident {
  monitor: {
    id: string;
    name: string;
    type: MonitorType;
    status: MonitorStatus;
  };
  resolvedByUser?: {
    email: string;
  };
}
