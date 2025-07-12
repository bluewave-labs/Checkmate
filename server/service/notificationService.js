class NotificationService {
	constructor({
		emailService,
		db,
		logger,
		networkService,
		stringService,
		notificationUtils,
	}) {
		this.emailService = emailService;
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.stringService = stringService;
		this.notificationUtils = notificationUtils;
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
		if (type !== "hardware" && statusChanged === false) return false;
		// if prevStatus is undefined, monitor is resuming, we're done
		if (type !== "hardware" && prevStatus === undefined) return false;

		const notificationIDs = networkResponse.monitor?.notifications ?? [];
		if (notificationIDs.length === 0) return false;

		// Get all notifications that need to be sent
		const notifications = await this.db.getNotificationsByIds(notificationIDs);

		// Filter notifications based on backoff settings
		const notificationsToSend = [];
		const notificationsToUpdate = [];

		for (const notification of notifications) {
			// Check if we should send this notification based on backoff settings
			if (this.notificationUtils.shouldSendNotification(notification)) {
				notificationsToSend.push(notification);

				// Update backoff parameters
				notification.lastNotificationTime = new Date();

				// If first notification, set current delay to initial
				if (!notification.currentBackoffDelay) {
					notification.currentBackoffDelay = notification.initialBackoffDelay;
				} else {
					// Calculate next backoff with jitter
					notification.currentBackoffDelay =
						this.notificationUtils.calculateNextBackoffDelay(
							notification.currentBackoffDelay,
							notification.backoffMultiplier,
							notification.maxBackoffDelay
						);
				}

				notificationsToUpdate.push(notification);
			}
		}

		// If no notifications to send after filtering, we're done
		if (notificationsToSend.length === 0) return false;

		// Save updated notification backoff parameters
		for (const notification of notificationsToUpdate) {
			await notification.save();
		}

		if (networkResponse.monitor.type === "hardware") {
			const thresholds = networkResponse?.monitor?.thresholds;

			if (thresholds === undefined) return false; // No thresholds set, we're done
			const metrics = networkResponse?.payload?.data ?? null;
			if (metrics === null) return false; // No metrics, we're done

			const alerts = await this.notificationUtils.buildHardwareAlerts(networkResponse);
			if (alerts.length === 0) return false;

			const { subject, html } = await this.notificationUtils.buildHardwareEmail(
				networkResponse,
				alerts
			);
			const content =
				await this.notificationUtils.buildHardwareNotificationMessage(alerts);

			// Use filtered notifications instead of all notificationIDs
			const notificationIDsToSend = notificationsToSend.map((n) => n._id.toString());
			const success = await this.notifyAll({
				notificationIDs: notificationIDsToSend,
				subject,
				html,
				content,
			});
			return success;
		}

		// Status monitors
		const { subject, html } =
			await this.notificationUtils.buildStatusEmail(networkResponse);
		const content = await this.notificationUtils.buildWebhookMessage(networkResponse);

		// Use filtered notifications instead of all notificationIDs
		const notificationIDsToSend = notificationsToSend.map((n) => n._id.toString());
		const success = this.notifyAll({
			notificationIDs: notificationIDsToSend,
			subject,
			html,
			content,
		});
		return success;
	}

	async notifyAll({ notificationIDs, subject, html, content }) {
		const notifications = await this.db.getNotificationsByIds(notificationIDs);

		// Map each notification to a test promise
		const promises = notifications.map(async (notification) => {
			try {
				await this.sendNotification({ notification, subject, content, html });
				return true;
			} catch (error) {
				// Log the error but continue with other notifications
				this.logger.error({
					service: "NotificationService",
					method: "notifyAll",
					message: `Failed to send notification: ${error.message}`,
					notificationId: notification._id,
				});
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
