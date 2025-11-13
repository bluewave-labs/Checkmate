import { IMonitor } from "@/db/models/index.js";
import { INetworkService } from "./NetworkService.js";
import { ICheckService } from "../business/CheckService.js";
import { IMonitorStatsService } from "../business/MonitorStatsService.js";
import { IStatusService } from "./StatusService.js";
import { INotificationService } from "./NotificationService.js";
import { IMaintenanceService } from "../business/MaintenanceService.js";
import { IIncidentService } from "../business/IncidentService.js";
import ApiError from "@/utils/ApiError.js";
import { getChildLogger } from "@/logger/Logger.js";

const SERVICE_NAME = "JobGenerator";
const logger = getChildLogger(SERVICE_NAME);
export interface IJobGenerator {
  generateJob: () => (Monitor: IMonitor) => Promise<void>;
  generateCleanupJob: () => () => Promise<void>;
}

class JobGenerator implements IJobGenerator {
  public SERVICE_NAME: string;
  private networkService: INetworkService;
  private checkService: ICheckService;
  private monitorStatsService: IMonitorStatsService;
  private statusService: IStatusService;
  private notificationService: INotificationService;
  private maintenanceService: IMaintenanceService;
  private incidentService: IIncidentService;

  constructor(
    networkService: INetworkService,
    checkService: ICheckService,
    monitorStatsService: IMonitorStatsService,
    statusService: IStatusService,
    notificationService: INotificationService,
    incidentService: IIncidentService,
    maintenanceService: IMaintenanceService
  ) {
    this.SERVICE_NAME = SERVICE_NAME;
    this.networkService = networkService;
    this.checkService = checkService;
    this.monitorStatsService = monitorStatsService;
    this.statusService = statusService;
    this.notificationService = notificationService;
    this.incidentService = incidentService;
    this.maintenanceService = maintenanceService;
  }

  generateJob = () => {
    return async (monitor: IMonitor) => {
      try {
        const monitorId = monitor._id.toString();
        if (!monitorId) {
          throw new ApiError("No monitorID for creating job", 400);
        }

        // Check for active maintenance window, if found, skip the check
        const isInMaintenance = await this.maintenanceService.isInMaintenance(
          monitorId
        );
        if (isInMaintenance) {
          return;
        }

        const status = await this.networkService.requestStatus(monitor);
        const check = await this.checkService.buildCheck(status, monitor.type);
        await check.save();
        const [updatedMonitor, statusChanged] =
          await this.statusService.updateMonitorStatus(monitor, status);

        if (statusChanged) {
          const incident = await this.incidentService.handleStatusChange(
            updatedMonitor,
            check
          );

          // Best effort, don't wait, don't fail
          if (incident) {
            this.notificationService
              .handleNotifications(updatedMonitor, incident)
              .catch((error) => {
                logger.warn(error);
              });
          }
        }
        await this.statusService.updateMonitorStats(
          updatedMonitor,
          status,
          statusChanged
        );
      } catch (error) {
        throw error;
      }
    };
  };

  generateCleanupJob = () => {
    return async () => {
      try {
        await this.checkService.cleanupOrphanedChecks();
        await this.monitorStatsService.cleanupOrphanedMonitorStats();
      } catch (error) {
        throw error;
      }
    };
  };
}

export default JobGenerator;
