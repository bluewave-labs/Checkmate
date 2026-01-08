import type { INotificationChannel } from "@/db/models/index.js";
import { NotificationChannel } from "@/db/models/index.js";
import type { NotificationChannel as NotificationChannelEntity } from "@/types/domain/index.js";

import { INotificationChannelRepository } from "@/repositories/index.js";

class MongoNotificationRepository implements INotificationChannelRepository {
  private toEntity = (doc: INotificationChannel): NotificationChannelEntity => {
    return {
      id: doc._id.toString(),
      orgId: doc.orgId.toString(),
      teamId: doc.teamId.toString(),
      name: doc.name,
      type: doc.type,
      config: doc.config,
      isActive: doc.isActive,
      createdBy: doc.createdBy.toString(),
      updatedBy: doc.updatedBy.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  };
  create = async (data: Partial<NotificationChannelEntity>) => {
    const created = await NotificationChannel.create(data);
    return this.toEntity(created);
  };

  findById = async (notificationChannelId: string, teamId: string) => {
    const channel = await NotificationChannel.findOne({
      _id: notificationChannelId,
      teamId,
    });

    if (!channel) return null;
    return this.toEntity(channel);
  };

  findByTeamId = async (teamId: string) => {
    const channels = await NotificationChannel.find({ teamId });
    return channels.map(this.toEntity);
  };

  update = async (
    notificationChannelId: string,
    teamId: string,
    data: Partial<NotificationChannelEntity>
  ) => {
    const updatedChannel = await NotificationChannel.findOneAndUpdate(
      { _id: notificationChannelId, teamId },
      [
        {
          $set: data,
        },
      ],
      { new: true, runValidators: true }
    );

    if (!updatedChannel) return null;
    return this.toEntity(updatedChannel);
  };
  deleteById = async (notificationChannelId: string, teamId: string) => {
    const result = await NotificationChannel.deleteOne({
      _id: notificationChannelId,
      teamId,
    });
    return result.deletedCount === 1;
  };
}

export default MongoNotificationRepository;
