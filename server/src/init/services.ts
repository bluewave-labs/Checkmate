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
} from "@/repositories/index.js";

export const initServices = async () => {
  const monitorRepository = new MongoMonitorRepository();
  const checksRepository = new MongoChecksRepository();

  const checkService = new CheckService();
  const inviteService = new InviteService();
  const maintenanceService = new MaintenanceService();
  const monitorStatsService = new MonitorStatsService();
  const notificationChannelService = new NotificationChannelService();
  const userService = new UserService();
  const discordService = new DiscordService();
  const slackService = new SlackService();
  const webhookService = new WebhookService();
  const networkService = new NetworkService(got);
  const statusService = new StatusService(monitorRepository);
  const settingsService = new SettingsService();
  const stripeService = new StripeService();
  const billingService = new BillingService();
  const emailService = new EmailService(userService, settingsService);
  settingsService.setEmailService(emailService);
  const notificationService = new NotificationService(
    userService,
    settingsService
  );
  const incidentService = new IncidentService();
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
    monitorRepository
  );
  const meService = new MeService(entitlementsProvider);
  const monitorService = new MonitorService(
    jobQueue,
    monitorRepository,
    checksRepository
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
