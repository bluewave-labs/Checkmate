export const MaintenanceRepeats = ["no repeat", "daily", "weekly"] as const;
export type MaintenanceRepeat = (typeof MaintenanceRepeats)[number];

export interface IMaintenance extends Document {
  _id: string;
  orgId: string;
  teamId: string;
  name: string;
  isActive: boolean;
  repeat: MaintenanceRepeat;
  monitors: string[];
  startTime: Date;
  endTime: Date;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
