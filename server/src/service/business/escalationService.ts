const SERVICE_NAME = "escalationService";
import type { Monitor } from "@/types/monitor.js";
import type { Incident } from "@/types/incident.js";
import type { IIncidentsRepository, IMonitorsRepository, INotificationsRepository, ITeamsRepository } from "@/repositories/index.js";
import type { ILogger } from "@/utils/logger.js";
import type { INotificationsService } from "@/service/infrastructure/notificationsService.js";
import type { INotificationMessageBuilder } from "@/service/infrastructure/notificationMessageBuilder.js";
import type { EnvConfig } from "@/service/system/settingsService.js";

export interface IEscalationService {
	checkAndSendEscalations(): Promise<void>;
}

export class EscalationService implements IEscalationService {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private incidentsRepository: IIncidentsRepository;
	private monitorsRepository: IMonitorsRepository;
	private notificationsRepository: INotificationsRepository;
	private notificationService: INotificationsService;
	private notificationMessageBuilder: INotificationMessageBuilder;
	private teamsRepository: ITeamsRepository;
	private envConfig: EnvConfig;

	constructor(
		logger: ILogger,
		incidentsRepository: IIncidentsRepository,
		monitorsRepository: IMonitorsRepository,
		notificationsRepository: INotificationsRepository,
		notificationService: INotificationsService,
		notificationMessageBuilder: INotificationMessageBuilder,
		teamsRepository: ITeamsRepository,
		envConfig: EnvConfig
	) {
		this.logger = logger;
		this.incidentsRepository = incidentsRepository;
		this.monitorsRepository = monitorsRepository;
		this.notificationsRepository = notificationsRepository;
		this.notificationService = notificationService;
		this.notificationMessageBuilder = notificationMessageBuilder;
		this.teamsRepository = teamsRepository;
		this.envConfig = envConfig;
	}

	get serviceName() {
		return EscalationService.SERVICE_NAME;
	}

	checkAndSendEscalations = async (): Promise<void> => {
		try {
			// Get all team IDs
			const teamIds = await this.teamsRepository.findAllTeamIds();

			if (!teamIds || teamIds.length === 0) {
				this.logger.debug({
					service: SERVICE_NAME,
					method: "checkAndSendEscalations",
					message: "No teams found, skipping escalation check",
				});
				return;
			}

			const now = new Date();

			this.logger.debug({
				service: SERVICE_NAME,
				method: "checkAndSendEscalations",
				message: `Starting escalation check for ${teamIds.length} teams`,
				details: { teamCount: teamIds.length },
			});

			// Process each team
			for (const teamId of teamIds) {
				try {
					// Get all monitors for this team
					const monitors = await this.monitorsRepository.findByTeamId(teamId, {});

					if (!monitors || monitors.length === 0) {
						this.logger.debug({
							service: SERVICE_NAME,
							method: "checkAndSendEscalations",
							message: `No monitors found for team`,
							details: { teamId },
						});
						continue;
					}

					// For each monitor, check if there's an active incident that needs escalation
					for (const monitor of monitors) {
						try {
							// Skip if escalation not enabled on this monitor
							if (!monitor.escalationEnabled || !monitor.escalationDelayMinutes) {
								continue;
							}

							// Get the active incident for this specific monitor
							const activeIncident = await this.incidentsRepository.findActiveByMonitorId(monitor.id, teamId);

							if (!activeIncident) {
								this.logger.debug({
									service: SERVICE_NAME,
									method: "checkAndSendEscalations",
									message: `No active incident for monitor`,
									details: { monitorId: monitor.id, monitorName: monitor.name },
								});
								continue;
							}

							this.logger.debug({
								service: SERVICE_NAME,
								method: "checkAndSendEscalations",
								message: `Found active incident for monitor`,
								details: {
									monitorId: monitor.id,
									monitorName: monitor.name,
									incidentId: activeIncident.id,
									escalationLevel: activeIncident.escalationLevel,
									createdAt: activeIncident.startTime,
								},
							});

							// Skip if already escalated
							if (activeIncident.escalationLevel && activeIncident.escalationLevel > 0) {
								this.logger.debug({
									service: SERVICE_NAME,
									method: "checkAndSendEscalations",
									message: `Skipping - incident already escalated`,
									details: { incidentId: activeIncident.id, escalationLevel: activeIncident.escalationLevel },
								});
								continue;
							}

							// Calculate if escalation threshold has been met
							const incidentStartTime = new Date(activeIncident.startTime);
							const escalationTime = new Date(incidentStartTime.getTime() + monitor.escalationDelayMinutes * 60 * 1000);

							this.logger.debug({
								service: SERVICE_NAME,
								method: "checkAndSendEscalations",
								message: `Checking escalation threshold`,
								details: {
									incidentId: activeIncident.id,
									monitorId: monitor.id,
									incidentStartTime: incidentStartTime.toISOString(),
									escalationTime: escalationTime.toISOString(),
									currentTime: now.toISOString(),
									thresholdMet: now >= escalationTime,
								},
							});

							if (now >= escalationTime) {
								this.logger.info({
									service: SERVICE_NAME,
									method: "checkAndSendEscalations",
									message: `Escalation threshold met - sending escalation notification`,
									details: {
										incidentId: activeIncident.id,
										monitorId: monitor.id,
										monitorName: monitor.name,
										delayMinutes: monitor.escalationDelayMinutes,
									},
								});

								// Send escalation notification
								await this.sendEscalationNotification(monitor, activeIncident, this.envConfig.clientHost);

								// Update incident to mark as escalated
								await this.incidentsRepository.updateById(activeIncident.id, teamId, {
									escalationLevel: 1,
									escalationTriggeredAt: now,
								} as any);

								this.logger.info({
									service: SERVICE_NAME,
									method: "checkAndSendEscalations",
									message: `Marked incident as escalated`,
									details: {
										incidentId: activeIncident.id,
										monitorId: monitor.id,
									},
								});
							}
						} catch (monitorError) {
							this.logger.error({
								service: SERVICE_NAME,
								method: "checkAndSendEscalations",
								message: `Error processing monitor for escalation`,
								details: { monitorId: monitor.id, teamId },
								stack: monitorError instanceof Error ? monitorError.stack : undefined,
							});
						}
					}
				} catch (teamError) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "checkAndSendEscalations",
						message: `Error processing team for escalation`,
						details: { teamId },
						stack: teamError instanceof Error ? teamError.stack : undefined,
					});
				}
			}

			this.logger.debug({
				service: SERVICE_NAME,
				method: "checkAndSendEscalations",
				message: "Escalation check completed",
			});
		} catch (error) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "checkAndSendEscalations",
				message: error instanceof Error ? error.message : "Error checking escalations",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};

	private sendEscalationNotification = async (monitor: Monitor, incident: Incident, clientHost: string): Promise<void> => {
		if (!monitor.escalationEnabled) {
			this.logger.debug({
				service: SERVICE_NAME,
				method: "sendEscalationNotification",
				message: `Escalation disabled for monitor`,
				details: { monitorId: monitor.id, monitorName: monitor.name },
			});
			return;
		}

		if (!monitor.escalationNotificationIds || monitor.escalationNotificationIds.length === 0) {
			this.logger.warn({
				service: SERVICE_NAME,
				method: "sendEscalationNotification",
				message: `No escalation notification IDs configured for monitor - check monitor settings`,
				details: { monitorId: monitor.id, monitorName: monitor.name },
			});
			return;
		}

		try {
			this.logger.info({
				service: SERVICE_NAME,
				method: "sendEscalationNotification",
				message: `Preparing to send escalation notifications`,
				details: {
					monitorId: monitor.id,
					monitorName: monitor.name,
					escalationNotificationIds: monitor.escalationNotificationIds,
					incidentId: incident.id,
				},
			});

			// Build escalation message
			const message = this.notificationMessageBuilder.buildEscalationMessage(monitor, clientHost);

			// Send to each escalation notification channel
			const tasks = [];
			for (const notificationId of monitor.escalationNotificationIds) {
				try {
					this.logger.debug({
						service: SERVICE_NAME,
						method: "sendEscalationNotification",
						message: `Fetching escalation notification channel`,
						details: { notificationId, monitorId: monitor.id },
					});

					const notification = await this.notificationsRepository.findById(notificationId, monitor.teamId);
					if (notification) {
						this.logger.debug({
							service: SERVICE_NAME,
							method: "sendEscalationNotification",
							message: `Found escalation notification channel - sending`,
							details: {
								notificationId,
								notificationName: notification.notificationName,
								notificationType: notification.type,
								address: notification.address,
								monitorId: monitor.id,
							},
						});
						tasks.push(this.notificationService.sendEscalationNotification(notification, message));
					} else {
						this.logger.warn({
							service: SERVICE_NAME,
							method: "sendEscalationNotification",
							message: `Escalation notification channel not found`,
							details: { notificationId, monitorId: monitor.id, teamId: monitor.teamId },
						});
					}
				} catch (error) {
					this.logger.error({
						service: SERVICE_NAME,
						method: "sendEscalationNotification",
						message: `Failed to fetch escalation notification channel`,
						details: { notificationId, monitorId: monitor.id },
						stack: error instanceof Error ? error.stack : undefined,
					});
				}
			}

			// Send all notifications in parallel
			if (tasks.length > 0) {
				this.logger.info({
					service: SERVICE_NAME,
					method: "sendEscalationNotification",
					message: `Sending ${tasks.length} escalation notification(s)`,
					details: { monitorId: monitor.id, incidentId: incident.id },
				});

				const outcomes = await Promise.all(tasks);
				const succeeded = outcomes.filter(Boolean).length;
				const failed = outcomes.length - succeeded;

				this.logger.info({
					service: SERVICE_NAME,
					method: "sendEscalationNotification",
					message: `Escalation notifications sent`,
					details: { monitorId: monitor.id, succeeded, failed, total: outcomes.length },
				});

				if (failed > 0) {
					this.logger.warn({
						service: SERVICE_NAME,
						method: "sendEscalationNotification",
						message: `Some escalation notifications failed to send`,
						details: { succeeded, failed, total: outcomes.length },
					});
				}
			} else {
				this.logger.warn({
					service: SERVICE_NAME,
					method: "sendEscalationNotification",
					message: `No valid escalation notification channels available to send`,
					details: { monitorId: monitor.id, incidentId: incident.id },
				});
			}
		} catch (error) {
			this.logger.error({
				service: SERVICE_NAME,
				method: "sendEscalationNotification",
				message: error instanceof Error ? error.message : "Error sending escalation notification",
				details: { monitorId: monitor.id, incidentId: incident.id },
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	};
}
