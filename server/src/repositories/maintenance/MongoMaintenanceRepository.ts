import type { IMaintenanceRepository } from "@/repositories/maintenance/IMaintenanceRepository.js";
import { type IMaintenance, Maintenance } from "@/db/models/index.js";
import type { Maintenance as MaintenanceEntity } from "@/types/domain/index.js";
import { MaintenanceRepeats } from "@/types/domain/index.js";

class MongoMaintenanceRepository implements IMaintenanceRepository {
  private toEntity = (doc: IMaintenance): MaintenanceEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      teamId: doc.teamId.toString(),
      name: doc.name,
      isActive: doc.isActive,
      repeat: doc.repeat,
      monitors: doc.monitors?.map((m) => m.toString()) ?? [],
      startTime: doc.startTime,
      endTime: doc.endTime,
      createdBy: doc.createdBy.toString(),
      updatedBy: doc.updatedBy.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };

  create = async (data: Partial<MaintenanceEntity>) => {
    const maintenance = await Maintenance.create(data);
    return this.toEntity(maintenance);
  };

  findById = async (maintenanceId: string, teamId: string) => {
    const maintenance = await Maintenance.findOne({
      _id: maintenanceId,
      teamId,
    });
    if (!maintenance) return null;
    return this.toEntity(maintenance);
  };

  findByTeamId = async (teamId: string) => {
    const maintennaces = await Maintenance.find({ teamId });
    return maintennaces.map(this.toEntity);
  };

  findActive = async () => {
    const now = new Date();

    const activeMaintenances = await Maintenance.find({
      isActive: true,
      $or: [
        { repeat: { $in: MaintenanceRepeats } },
        { startTime: { $lte: now }, endTime: { $gte: now } },
      ],
    });
    return activeMaintenances.map(this.toEntity);
  };

  updateById = async (
    maintenanceId: string,
    teamId: string,
    patchData: Partial<MaintenanceEntity>
  ) => {
    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      { _id: maintenanceId, teamId },
      [
        {
          $set: patchData,
        },
      ],
      { new: true, runValidators: true }
    );
    if (!updatedMaintenance) return null;
    return this.toEntity(updatedMaintenance);
  };

  deleteById = async (maintenanceId: string, teamId: string) => {
    const result = await Maintenance.deleteOne({ _id: maintenanceId, teamId });
    return result.deletedCount === 1;
  };
}

export default MongoMaintenanceRepository;
