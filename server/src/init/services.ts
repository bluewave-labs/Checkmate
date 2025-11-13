import {
  CheckService,
  InviteService,
  MaintenanceService,
  MonitorStatsService,
  NotificationChannelService,
  UserService,
  DiscordService,
  EmailService,
  SlackService,
  WebhookService,
  NetworkService,
  StatusService,
  NotificationService,
  JobQueue,
  JobGenerator,
  AuthService,
  MonitorService,
  QueueService,
  ServiceRegistry,
  TeamService,
  RoleService,
  TeamMemberService,
  StatusPageService,
  DiagnosticService,
  RecoveryService,
  IncidentService,
} from "@/services/index.js";

export const initServices = async () => {
  const checkService = new CheckService();
  const inviteService = new InviteService();
  const maintenanceService = new MaintenanceService();
  const monitorStatsService = new MonitorStatsService();
  const notificationChannelService = new NotificationChannelService();
  const userService = new UserService();
  const discordService = new DiscordService();
  const emailService = new EmailService(userService);
  const slackService = new SlackService();
  const webhookService = new WebhookService();
  const networkService = new NetworkService();
  const statusService = new StatusService();
  const notificationService = new NotificationService(userService);
  const incidentService = new IncidentService();
  const jobGenerator = new JobGenerator(
    networkService,
    checkService,
    monitorStatsService,
    statusService,
    notificationService,
    incidentService,
    maintenanceService
  );
  const jobQueue = await JobQueue.create(jobGenerator);
  const authService = new AuthService(jobQueue);
  const monitorService = new MonitorService(jobQueue);
  const queueService = new QueueService(jobQueue);
  const teamService = new TeamService(jobQueue);
  const roleService = new RoleService();
  const teamMemberService = new TeamMemberService();
  const statusPageService = new StatusPageService();
  const diagnosticService = new DiagnosticService(jobQueue);
  const recoveryService = new RecoveryService();
  const services = {
    checkService,
    inviteService,
    maintenanceService,
    monitorStatsService,
    notificationChannelService,
    userService,
    discordService,
    emailService,
    slackService,
    webhookService,
    networkService,
    statusService,
    notificationService,
    jobGenerator,
    jobQueue,
    authService,
    monitorService,
    queueService,
    teamService,
    roleService,
    teamMemberService,
    statusPageService,
    diagnosticService,
    recoveryService,
    incidentService,
  };

  Object.values(services).forEach((service) => {
    ServiceRegistry.register(service.SERVICE_NAME, service);
  });

  return services;
};
