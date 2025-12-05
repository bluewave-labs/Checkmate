import { IMonitor, ICheck, Incident } from "@/db/models/index.js";
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

  private evaluateThresholds = async (
    monitor: IMonitor,
    check: ICheck
  ) => {
    try {
      // Only for infrastructure monitors and only when service is up
      if (monitor.type !== "infrastructure" || monitor.status !== "up") return;
      if (!monitor.thresholds) return;
      if (!check?.system) return;

      const { thresholds: t } = monitor;
      const breaches: string[] = [];

      const cpu = check.system?.cpu?.usage_percent;
      if (
        typeof t?.cpu === "number" &&
        typeof cpu === "number" &&
        cpu > t.cpu
      ) {
        breaches.push(`cpu ${cpu}% > ${t.cpu}%`);
      }

      const mem = check.system?.memory?.usage_percent;
      if (
        typeof t?.memory === "number" &&
        typeof mem === "number" &&
        mem > t.memory
      ) {
        breaches.push(`memory ${mem}% > ${t.memory}%`);
      }

      const diskUsages: number[] = Array.isArray(check.system?.disk)
        ? check.system.disk
            .map((d) => d?.usage_percent)
            .filter((n): n is number => typeof n === "number")
        : [];
      const maxDisk = diskUsages.length ? Math.max(...diskUsages) : undefined;
      if (
        typeof t?.disk === "number" &&
        typeof maxDisk === "number" &&
        maxDisk > t.disk
      ) {
        breaches.push(`disk ${maxDisk}% > ${t.disk}%`);
      }

      const temps: number[] = Array.isArray(check.system?.cpu?.temperature)
        ? check.system.cpu.temperature.filter(
            (n): n is number => typeof n === "number"
          )
        : [];
      const maxTemp = temps.length ? Math.max(...temps) : undefined;
      if (
        typeof t?.temperature === "number" &&
        typeof maxTemp === "number" &&
        maxTemp > t.temperature
      ) {
        breaches.push(`temperature ${maxTemp}C > ${t.temperature}C`);
      }

      // If any breach → ensure one open incident exists; else resolve if one exists
      const hasBreach = breaches.length > 0;
      const existingOpen = await Incident.findOne({
        monitorId: monitor._id,
        teamId: monitor.teamId,
        resolved: false,
      });

      if (hasBreach && !existingOpen) {
        const incident = await this.incidentService.create(
          monitor.teamId,
          monitor._id,
          check._id
        );
        // annotate with threshold note best-effort
        try {
          if (breaches.length) {
            await Incident.updateOne(
              { _id: incident._id },
              {
                $set: {
                  resolutionNote: `threshold breach: ${breaches.join(", ")}`,
                },
              }
            );
          }
        } catch {}
        this.notificationService
          .handleNotifications(monitor, incident)
          .catch(() => {});
      }

      if (!hasBreach && existingOpen) {
        await this.incidentService.resolve(
          monitor.teamId.toString(),
          existingOpen._id.toString(),
          "auto",
          check
        );
      }
    } catch {
      // best-effort; do not throw from evaluator
    }
  };

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

        // Evaluate thresholds after saving the check and updating stats
        await this.evaluateThresholds(updatedMonitor, check);
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
        await this.incidentService.cleanupOrphanedIncidents();
      } catch (error) {
        throw error;
      }
    };
  };
}

export default JobGenerator;
