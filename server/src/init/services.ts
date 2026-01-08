import got from "got";

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
  TeamService,
  RoleService,
  TeamMemberService,
  StatusPageService,
  DiagnosticService,
  RecoveryService,
  IncidentService,
  SettingsService,
  StripeService,
  BillingService,
  StatsAggregationService,
} from "@/services/index.js";
import { EntitlementsFactory } from "@/services/system/EntitlementsService.js";
import { MeService } from "@/services/index.js";
import {
  MongoMonitorRepository,
  MongoChecksRepository,
  MongoMonitorStatsRepository,
  MongoIncidentsRepository,
  MongoUserRepository,
  MongoRoleRepository,
  MongoTeamRepository,
  MongoInviteRepository,
  MongoTeamMembershipRepository,
  MongoOrgRepository,
  MongoOrgMembershipRepository,
  MongoMaintenanceRepository,
  MongoNotificationChannelRepository,
} from "@/repositories/index.js";

export const initServices = async () => {
  const monitorRepository = new MongoMonitorRepository();
  const checksRepository = new MongoChecksRepository();
  const monitorStatsRepository = new MongoMonitorStatsRepository();
  const incidentsRepository = new MongoIncidentsRepository();
  const userRepository = new MongoUserRepository();
  const roleRepository = new MongoRoleRepository();
  const teamRepository = new MongoTeamRepository();
  const inviteRepository = new MongoInviteRepository();
  const teamMembershipRepository = new MongoTeamMembershipRepository();
  const orgRepository = new MongoOrgRepository();
  const orgMembershipRepository = new MongoOrgMembershipRepository();
  const maintenanceRepository = new MongoMaintenanceRepository();
  const notificationChannelRepository = new MongoNotificationChannelRepository();

  const checkService = new CheckService(checksRepository, monitorRepository);
  const inviteService = new InviteService(
    userRepository,
    roleRepository,
    teamRepository,
    inviteRepository,
    teamMembershipRepository
  );
  const maintenanceService = new MaintenanceService(
    maintenanceRepository,
    monitorRepository
  );
  const monitorStatsService = new MonitorStatsService(
    monitorRepository,
    monitorStatsRepository
  );
  const notificationChannelService = new NotificationChannelService(
    notificationChannelRepository,
    monitorRepository
  );
  const userService = new UserService();
  const discordService = new DiscordService();
  const slackService = new SlackService();
  const webhookService = new WebhookService();
  const networkService = new NetworkService(got);
  const statusService = new StatusService(
    monitorRepository,
    monitorStatsRepository
  );
  const settingsService = new SettingsService();
  const stripeService = new StripeService();
  const billingService = new BillingService();
  const emailService = new EmailService(userService, settingsService);
  settingsService.setEmailService(emailService);
  const notificationService = new NotificationService(
    userService,
    settingsService
  );
  const incidentService = new IncidentService(
    incidentsRepository,
    monitorRepository
  );
  const statsAggregationService = new StatsAggregationService();
  const jobGenerator = new JobGenerator(
    networkService,
    checkService,
    monitorStatsService,
    statusService,
    notificationService,
    incidentService,
    maintenanceService,
    statsAggregationService
  );
  const jobQueue = await JobQueue.create(jobGenerator, monitorRepository);
  const entitlementsProvider = EntitlementsFactory.create();
  const authService = new AuthService(
    jobQueue,
    entitlementsProvider,
    monitorRepository,
    userRepository,
    roleRepository,
    orgRepository,
    orgMembershipRepository,
    teamRepository,
    teamMembershipRepository
  );
  const meService = new MeService(
    entitlementsProvider,
    userRepository,
    orgRepository,
    orgMembershipRepository,
    teamRepository,
    teamMembershipRepository,
    roleRepository
  );
  const monitorService = new MonitorService(
    jobQueue,
    monitorRepository,
    checksRepository,
    monitorStatsRepository
  );
  const queueService = new QueueService(jobQueue);
  const teamService = new TeamService(jobQueue, monitorRepository);
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
    meService,
    monitorService,
    queueService,
    teamService,
    roleService,
    teamMemberService,
    statusPageService,
    diagnosticService,
    recoveryService,
    incidentService,
    settingsService,
    billingService,
    stripeService,
  };

  return services;
};
