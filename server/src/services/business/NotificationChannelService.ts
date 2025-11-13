import mongoose from "mongoose";

import {
  IUserContext,
  INotificationChannel,
  NotificationChannel,
  Monitor,
} from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

const SERVICE_NAME = "NotificationChannelService";

export interface INotificationChannelService {
  create: (
    tokenizedUser: IUserContext,
    notificationChannel: INotificationChannel
  ) => Promise<INotificationChannel>;
  getAll: (teamId: string) => Promise<INotificationChannel[]>;
  get: (teamId: string, id: string) => Promise<INotificationChannel>;
  toggleActive: (
    teamId: string,
    tokenizedUser: IUserContext,
    id: string
  ) => Promise<INotificationChannel>;
  update: (
    teamId: string,
    tokenizedUser: IUserContext,
    id: string,
    updateData: Partial<INotificationChannel>
  ) => Promise<INotificationChannel>;
  delete: (teamId: string, id: string) => Promise<boolean>;
}

class NotificationChannelService implements INotificationChannelService {
  public SERVICE_NAME: string;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
  }

  create = async (
    userContext: IUserContext,
    notificationChannelData: INotificationChannel
  ) => {
    const data: INotificationChannel = {
      ...notificationChannelData,
      orgId: new mongoose.Types.ObjectId(userContext.orgId),
      teamId: new mongoose.Types.ObjectId(userContext.currentTeamId),
      createdBy: new mongoose.Types.ObjectId(userContext.sub),
      updatedBy: new mongoose.Types.ObjectId(userContext.sub),
    };

    const notificationChannel = await NotificationChannel.create(data);
    return notificationChannel;
  };

  get = async (teamId: string, id: string) => {
    const channel = await NotificationChannel.findOne({ _id: id, teamId });
    if (!channel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return channel;
  };

  getAll = async (teamId: string) => {
    return NotificationChannel.find({ teamId });
  };

  toggleActive = async (
    teamId: string,
    userContext: IUserContext,
    id: string
  ) => {
    const updatedChannel = await NotificationChannel.findOneAndUpdate(
      { _id: id, teamId },
      [
        {
          $set: {
            isActive: { $not: "$isActive" },
            updatedBy: userContext.sub,
            updatedAt: new Date(),
          },
        },
      ],
      { new: true }
    );
    if (!updatedChannel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return updatedChannel;
  };

  update = async (
    teamId: string,
    userContext: IUserContext,
    id: string,
    updateData: Partial<INotificationChannel>
  ) => {
    const updatedChannel = await NotificationChannel.findOneAndUpdate(
      { _id: id, teamId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
          updatedBy: userContext.sub,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedChannel) {
      throw new ApiError("Failed to update notification channel", 500);
    }

    return updatedChannel;
  };

  delete = async (teamId: string, id: string) => {
    const result = await NotificationChannel.deleteOne({ _id: id, teamId });
    if (!result.deletedCount) {
      throw new ApiError("Notification channel not found", 404);
    }

    await Monitor.updateMany(
      { notificationChannels: id },
      { $pull: { notificationChannels: id } }
    );
    return result.deletedCount === 1;
  };
}

export default NotificationChannelService;
