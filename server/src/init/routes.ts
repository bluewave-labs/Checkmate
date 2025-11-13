import type { Express } from "express";
import {
  AuthRoutes,
  InviteRoutes,
  MaintenanceRoutes,
  MonitorRoutes,
  NotificationChannelRoutes,
  QueueRoutes,
  TeamRoutes,
  RoleRoutes,
  TeamMemberRoutes,
  ChecksRoutes,
  StatusPageRoutes,
  DiagnosticRoutes,
  RecoveryRoutes,
  ProfileRoutes,
  IncidentsRoutes,
} from "@/routes/index.js";
import { errorHandler } from "@/middleware/ErrorHandler.js";
export const initRoutes = (controllers: any, app: Express) => {
  const authRoutes = new AuthRoutes(controllers.authController);
  const inviteRoutes = new InviteRoutes(controllers.inviteController);
  const maintenanceRoutes = new MaintenanceRoutes(
    controllers.maintenanceController
  );
  const monitorRoutes = new MonitorRoutes(controllers.monitorController);
  const notificationChannelRoutes = new NotificationChannelRoutes(
    controllers.notificationChannelController
  );
  const queueRoutes = new QueueRoutes(controllers.queueController);
  const teamRoutes = new TeamRoutes(controllers.teamController);
  const roleRoutes = new RoleRoutes(controllers.roleController);
  const teamMemberRoutes = new TeamMemberRoutes(
    controllers.teamMemberController
  );
  const checksRoutes = new ChecksRoutes(controllers.checksController);
  const statusPageRoutes = new StatusPageRoutes(
    controllers.statusPageController
  );
  const diagnosticRoutes = new DiagnosticRoutes(
    controllers.diagnosticController
  );

  const recoveryRoutes = new RecoveryRoutes(controllers.recoveryController);
  const profileRoutes = new ProfileRoutes(controllers.profileController);
  const incidentsRoutes = new IncidentsRoutes(controllers.incidentsController);

  app.use("/api/v1/auth", authRoutes.getRouter());
  app.use("/api/v1/invite", inviteRoutes.getRouter());
  app.use("/api/v1/maintenance", maintenanceRoutes.getRouter());
  app.use("/api/v1/monitors", monitorRoutes.getRouter());
  app.use(
    "/api/v1/notification-channels",
    notificationChannelRoutes.getRouter()
  );
  app.use("/api/v1/queue", queueRoutes.getRouter());
  app.use("/api/v1/teams", teamRoutes.getRouter());
  app.use("/api/v1/roles", roleRoutes.getRouter());
  app.use("/api/v1/team-members", teamMemberRoutes.getRouter());
  app.use("/api/v1/checks", checksRoutes.getRouter());
  app.use("/api/v1/status-pages", statusPageRoutes.getRouter());
  app.use("/api/v1/diagnostic", diagnosticRoutes.getRouter());
  app.use("/api/v1/recovery", recoveryRoutes.getRouter());
  app.use("/api/v1/profile", profileRoutes.getRouter());
  app.use("/api/v1/incidents", incidentsRoutes.getRouter());
  app.use(errorHandler);
};
