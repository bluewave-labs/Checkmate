const SERVICE_NAME = "NotificationService";

class NotificationService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ emailService, db, logger, networkService, stringService, notificationUtils }) {
		this.emailService = emailService;
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.stringService = stringService;
		this.notificationUtils = notificationUtils;
	}

	get serviceName() {
		return NotificationService.SERVICE_NAME;
	}

	sendNotification = async ({ notification, subject, content, html }) => {
		const { type, address } = notification;

		if (type === "email") {
			const messageId = await this.emailService.sendEmail(address, subject, html);
			if (!messageId) return false;
			return true;
		}

		// Create a body for webhooks
		let body = { text: content };
		if (type === "discord") {
			body = { content };
		}

		if (type === "slack" || type === "discord" || type === "webhook") {
			const response = await this.networkService.requestWebhook(type, address, body);
			return response.status;
		}
		if (type === "pager_duty") {
			const response = await this.networkService.requestPagerDuty({
				message: content,
				monitorUrl: subject,
				routingKey: address,
			});

			return response;
		}
	};

	async handleNotifications(networkResponse) {
		const { monitor, statusChanged, prevStatus } = networkResponse;
		const { type } = monitor;
		
		// For non-hardware monitors, implement alert suppression
		if (type !== "hardware") {
			// Monitor is DOWN
			if (monitor.status === false) {
				// If alert already sent for this incident, skip
				if (monitor.alertSentForCurrentIncident === true) {
					this.logger.info({
						service: this.SERVICE_NAME,
						message: `Skipping notification for ${monitor.name} - alert already sent for this incident`,
					});
					return false;
				}
				// Send alert and mark as sent
				// Will continue to send the alert below
			} 
			// Monitor is UP
			else if (monitor.status === true) {
				// Reset alert flag when monitor comes back up
				if (monitor.alertSentForCurrentIncident === true) {
					monitor.alertSentForCurrentIncident = false;
					await monitor.save();
					// Send recovery notification if it was previously down
					if (prevStatus === false) {
						// Will continue to send the recovery alert below
					} else {
						return false; // No need to send alert if it wasn't down
					}
				} else if (!statusChanged) {
					return false; // No status change and no alert to reset
				}
			}
		}

		const notificationIDs = networkResponse.monitor?.notifications ?? [];
		if (notificationIDs.length === 0) return false;

		if (networkResponse.monitor.type === "hardware") {
			const thresholds = networkResponse?.monitor?.thresholds;

			if (thresholds === undefined) return false; // No thresholds set, we're done
			const metrics = networkResponse?.payload?.data ?? null;
			if (metrics === null) return false; // No metrics, we're done

			const alerts = await this.notificationUtils.buildHardwareAlerts(networkResponse);
			if (alerts.length === 0) return false;

			const { subject, html } = await this.notificationUtils.buildHardwareEmail(networkResponse, alerts);
			const content = await this.notificationUtils.buildHardwareNotificationMessage(alerts);

			const success = await this.notifyAll({ notificationIDs, subject, html, content });
			return success;
		}

		// Status monitors
		const { subject, html } = await this.notificationUtils.buildStatusEmail(networkResponse);
		const content = await this.notificationUtils.buildWebhookMessage(networkResponse);
		const success = await this.notifyAll({ notificationIDs, subject, html, content });
		
		// Mark alert as sent if monitor is down and notification was successful
		if (success && monitor.status === false && type !== "hardware") {
			monitor.alertSentForCurrentIncident = true;
			monitor.lastAlertSentAt = new Date();
			await monitor.save();
			this.logger.info({
				service: this.SERVICE_NAME,
				message: `Marked alert as sent for ${monitor.name}`,
			});
		}
		
		return success;
	}

	async notifyAll({ notificationIDs, subject, html, content }) {
		const notifications = await this.db.notificationModule.getNotificationsByIds(notificationIDs);

		// Map each notification to a test promise
		const promises = notifications.map(async (notification) => {
			try {
				await this.sendNotification({ notification, subject, content, html });
				return true;
			} catch (err) {
				return false;
			}
		});

		const results = await Promise.all(promises);
		return results.every((r) => r === true);
	}

	async getTestNotification() {
		const html = await this.notificationUtils.buildTestEmail();
		const content = "This is a test notification";
		const subject = "Test Notification";
		return { subject, html, content };
	}

	async testAllNotifications(notificationIDs) {
		const { subject, html, content } = await this.getTestNotification();
		return this.notifyAll({ notificationIDs, subject, html, content });
	}

	async sendTestNotification(notification) {
		const { subject, html, content } = await this.getTestNotification();
		const success = await this.sendNotification({ notification, subject, content, html });
		return success;
	}
}

export default NotificationService;
