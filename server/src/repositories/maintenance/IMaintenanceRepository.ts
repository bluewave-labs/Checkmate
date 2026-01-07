import type { Maintenance } from "@/types/domain/index.js";
export interface IMaintenanceRepository {
  // create
  create(maintenanceData: Partial<Maintenance>): Promise<Maintenance>;
  // single fetch
  findById(maintenanceId: string, teamId: string): Promise<Maintenance | null>;
  // collection fetch
  findByTeamId(teamId: string): Promise<Maintenance[]>;
  findActive(): Promise<Maintenance[]>;
  // update
  updateById(
    maintenanceId: string,
    teamId: string,
    patchData: Partial<Maintenance>
  ): Promise<Maintenance | null>;
  // delete
  deleteById(maintenanceId: string, teamId: string): Promise<boolean>;
}
