import ApiError from "@/utils/ApiError.js";
import {
  INotificationChannelRepository,
  IMonitorRepository,
} from "@/repositories/index.js";
import {
  type UserContext,
  NotificationChannel as NotificationChannelEntity,
} from "@/types/domain/index.js";

const SERVICE_NAME = "NotificationChannelService";

export interface INotificationChannelService {
  create: (
    tokenizedUser: UserContext,
    notificationChannel: NotificationChannelEntity
  ) => Promise<NotificationChannelEntity>;
  getAll: (teamId: string) => Promise<NotificationChannelEntity[]>;
  get: (teamId: string, id: string) => Promise<NotificationChannelEntity>;
  toggleActive: (
    teamId: string,
    tokenizedUser: UserContext,
    id: string
  ) => Promise<NotificationChannelEntity>;
  update: (
    teamId: string,
    tokenizedUser: UserContext,
    id: string,
    updateData: Partial<NotificationChannelEntity>
  ) => Promise<NotificationChannelEntity>;
  delete: (teamId: string, id: string) => Promise<boolean>;
}

class NotificationChannelService implements INotificationChannelService {
  public SERVICE_NAME: string;
  private notificationChannelRepository: INotificationChannelRepository;
  private monitorRepository: IMonitorRepository;
  constructor(
    notificationChannelRepository: INotificationChannelRepository,
    monitorRepository: IMonitorRepository
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.notificationChannelRepository = notificationChannelRepository;
    this.monitorRepository = monitorRepository;
  }

  create = async (
    userContext: UserContext,
    notificationChannelData: NotificationChannelEntity
  ) => {
    const notificationChannel = await this.notificationChannelRepository.create(
      {
        ...notificationChannelData,
        orgId: userContext.orgId,
        teamId: userContext.currentTeamId || "",
        createdBy: userContext.sub,
        updatedBy: userContext.sub,
      }
    );
    return notificationChannel;
  };

  get = async (teamId: string, id: string) => {
    const channel = await this.notificationChannelRepository.findById(
      id,
      teamId
    );
    if (!channel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return channel;
  };

  getAll = async (teamId: string) => {
    return await this.notificationChannelRepository.findByTeamId(teamId);
  };

  toggleActive = async (
    teamId: string,
    userContext: UserContext,
    id: string
  ) => {
    const updatedChannel = await this.notificationChannelRepository.update(
      id,
      teamId,
      {
        isActive: { $not: "$isActive" },
        updatedBy: userContext.sub,
        updatedAt: new Date(),
      }
    );
    if (!updatedChannel) {
      throw new ApiError("Notification channel not found", 404);
    }
    return updatedChannel;
  };

  update = async (
    teamId: string,
    userContext: UserContext,
    id: string,
    updateData: Partial<NotificationChannelEntity>
  ) => {
    const updatedChannel = await this.notificationChannelRepository.update(
      id,
      teamId,
      {
        ...updateData,
        updatedAt: new Date(),
        updatedBy: userContext.sub,
      }
    );

    if (!updatedChannel) {
      throw new ApiError("Failed to update notification channel", 500);
    }

    return updatedChannel;
  };

  delete = async (teamId: string, notificationChannelId: string) => {
    const didDelete = await this.notificationChannelRepository.deleteById(
      notificationChannelId,
      teamId
    );
    if (!didDelete) {
      throw new ApiError("Notification channel not found", 404);
    }

    await this.monitorRepository.removeNotificationChannelFromMonitors(
      notificationChannelId
    );

    return didDelete;
  };
}

export default NotificationChannelService;
