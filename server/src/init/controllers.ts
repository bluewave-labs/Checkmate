import {
  AuthController,
  InviteController,
  MaintenanceController,
  MonitorController,
  NotificationChannelController,
  QueueController,
  TeamController,
  RoleController,
  TeamMemberController,
  ChecksController,
  StatusPageController,
  DiagnosticController,
  RecoveryController,
  ProfileController,
  IncidentsController,
} from "@/controllers/index.js";
import { UserService } from "@/services/index.js";

export const initControllers = (services: any) => {
  const controllers: Record<string, any> = {};

  controllers.authController = new AuthController(
    services.authService,
    services.inviteService
  );
  controllers.inviteController = new InviteController(services.inviteService);
  controllers.maintenanceController = new MaintenanceController(
    services.maintenanceService
  );
  controllers.monitorController = new MonitorController(
    services.monitorService,
    services.checkService,
    services.notificationService
  );
  controllers.notificationChannelController = new NotificationChannelController(
    services.notificationChannelService,
    services.notificationService
  );
  controllers.queueController = new QueueController(services.jobQueue);

  controllers.teamController = new TeamController(services.teamService);

  controllers.roleController = new RoleController(services.roleService);

  controllers.teamMemberController = new TeamMemberController(
    services.teamMemberService
  );

  controllers.checksController = new ChecksController(services.checkService);
  controllers.statusPageController = new StatusPageController(
    services.statusPageService
  );
  controllers.diagnosticController = new DiagnosticController(
    services.diagnosticService
  );
  controllers.recoveryController = new RecoveryController(
    services.recoveryService,
    services.authService,
    services.emailService
  );
  controllers.profileController = new ProfileController(services.userService);
  controllers.incidentsController = new IncidentsController(
    services.incidentService,
    services.notificationService,
    services.monitorService
  );

  return controllers;
};
