export const MaintenanceRepeats = ["no repeat", "daily", "weekly"] as const;
export type MaintenanceRepeat = (typeof MaintenanceRepeats)[number];

export interface Maintenance {
  id: string;
  orgId: string;
  teamId: string;
  name: string;
  isActive: boolean | unknown;
  repeat: MaintenanceRepeat;
  monitors: string[];
  startTime: string;
  endTime: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
