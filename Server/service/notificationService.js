const SERVICE_NAME = "NotificationService";
const TELEGRAM_API_BASE_URL = "https://api.telegram.org/bot";

class NotificationService {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of NotificationService.
	 *
	 * @param {Object} emailService - The email service used for sending notifications.
	 * @param {Object} db - The database instance for storing notification data.
	 * @param {Object} logger - The logger instance for logging activities.
	 */
	constructor(emailService, db, logger, networkService) {
		this.SERVICE_NAME = SERVICE_NAME;
		this.emailService = emailService;
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
	}

	formatNotificationMessage(monitor, status, platform, chatId) {
		const messageText = `Monitor ${monitor.name} is ${status ? "up" : "down"}. URL: ${monitor.url}`;
	
		if (platform === 'telegram') {
			return { chat_id: chatId, text: messageText };
		}
		if (platform === 'slack') {
			return { text: messageText };
		}
		if (platform === 'discord') {
			return { content: messageText };
		}
		return null;
	}

	async sendWebhookNotification(networkResponse, config) {
		const { monitor, status } = networkResponse;
		const { type, webhookUrl, botToken, chatId } = config;
		let url = webhookUrl;
	
		const message = this.formatNotificationMessage(monitor, status, type, chatId);
		if (message === null) {
			this.logger.warn({
				message: `Unsupported webhook type: ${type}`,
				service: this.SERVICE_NAME,
				method: 'sendWebhookNotification',
				type
			});
			return false;
		}
	
		if (type === 'telegram') {
			if (!botToken || !chatId) {
				return false;
			}
			url = `${TELEGRAM_API_BASE_URL}${botToken}/sendMessage`;
		}
	
		try {
			const response = await this.networkService.requestWebhook(type, url, message);
			return response.status;
		} catch (error) {
			this.logger.error({
				message: `Error sending ${type} notification`,
				service: this.SERVICE_NAME,
				method: 'sendWebhookNotification',
				error: error.message,
				stack: error.stack,
				url,
				type,
				requestPayload: message
			});
			return false;
		}
	}
		
	/**
	 * Sends an email notification for hardware infrastructure alerts
	 *
	 * @async
	 * @function sendHardwareEmail
	 * @param {Object} networkResponse - Response object containing monitor information
	 * @param {string} address - Email address to send the notification to
	 * @param {Array} [alerts=[]] - List of hardware alerts to include in the email
	 * @returns {Promise<boolean>} - Indicates whether email was sent successfully
	 * @throws {Error}
	 */
	async sendHardwareEmail(networkResponse, address, alerts = []) {
		if (alerts.length === 0) return false;
		const { monitor, status, prevStatus } = networkResponse;
		const template = "hardwareIncidentTemplate";
		const context = { monitor: monitor.name, url: monitor.url, alerts };
		const subject = `Monitor ${monitor.name} infrastructure alerts`;
		this.emailService.buildAndSendEmail(template, context, address, subject);
		return true;
	}

	/**
	 * Sends an email notification about monitor status change
	 *
	 * @async
	 * @function sendEmail
	 * @param {Object} networkResponse - Response object containing monitor status information
	 * @param {string} address - Email address to send the notification to
	 * @returns {Promise<boolean>} - Indicates email was sent successfully
	 */
	async sendEmail(networkResponse, address) {
		const { monitor, status, prevStatus } = networkResponse;
		const template = prevStatus === false ? "serverIsUpTemplate" : "serverIsDownTemplate";
		const context = { monitor: monitor.name, url: monitor.url };
		const subject = `Monitor ${monitor.name} is ${status === true ? "up" : "down"}`;
		this.emailService.buildAndSendEmail(template, context, address, subject);
		return true;
	}

	async handleStatusNotifications(networkResponse) {
		try {
			//If status hasn't changed, we're done
			if (networkResponse.statusChanged === false) return false;
			// if prevStatus is undefined, monitor is resuming, we're done
			if (networkResponse.prevStatus === undefined) return false;
	
			const notifications = await this.db.getNotificationsByMonitorId(networkResponse.monitorId);
	
			for (const notification of notifications) {
				if (notification.type === "email") {
					this.sendEmail(networkResponse, notification.address);
				} else if (notification.type === "webhook") {
					this.sendWebhookNotification(networkResponse, notification.address, notification.type);
				
				// Handle other types of notifications here
			}
		}
			return true;
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "handleNotifications",
				stack: error.stack,
			});
		}
	}
	/**
	 * Handles status change notifications for a monitor
	 *
	 * @async
	 * @function handleStatusNotifications
	 * @param {Object} networkResponse - Response object containing monitor status information
	 * @returns {Promise<boolean>} - Indicates whether notifications were processed
	 * @throws {Error}
	 */
	async handleHardwareNotifications(networkResponse) {
		const thresholds = networkResponse?.monitor?.thresholds;
		if (thresholds === undefined) return false; // No thresholds set, we're done

		// Get thresholds from monitor
		const {
			usage_cpu: cpuThreshold = -1,
			usage_memory: memoryThreshold = -1,
			usage_disk: diskThreshold = -1,
		} = thresholds;

		// Get metrics from response
		const metrics = networkResponse?.payload?.data ?? null;
		if (metrics === null) return false;

		const {
			cpu: { usage_percent: cpuUsage = -1 } = {},
			memory: { usage_percent: memoryUsage = -1 } = {},
			disk = [],
		} = metrics;

		const alerts = {
			cpu: cpuThreshold !== -1 && cpuUsage > cpuThreshold ? true : false,
			memory: memoryThreshold !== -1 && memoryUsage > memoryThreshold ? true : false,
			disk: disk.some((d) => diskThreshold !== -1 && d.usage_percent > diskThreshold)
				? true
				: false,
		};

		const notifications = await this.db.getNotificationsByMonitorId(
			networkResponse.monitorId
		);
		for (const notification of notifications) {
			const alertsToSend = [];
			const alertTypes = ["cpu", "memory", "disk"];

			for (const type of alertTypes) {
				// Iterate over each alert type to see if any need to be decremented
				if (alerts[type] === true) {
					notification[`${type}AlertThreshold`]--; // Decrement threshold if an alert is triggered

					if (notification[`${type}AlertThreshold`] <= 0) {
						// If threshold drops below 0, reset and send notification
						notification[`${type}AlertThreshold`] = notification.alertThreshold;

						const formatAlert = {
							cpu: () =>
								`Your current CPU usage (${(cpuUsage * 100).toFixed(0)}%) is above your threshold (${(cpuThreshold * 100).toFixed(0)}%)`,
							memory: () =>
								`Your current memory usage (${(memoryUsage * 100).toFixed(0)}%) is above your threshold (${(memoryThreshold * 100).toFixed(0)}%)`,
							disk: () =>
								`Your current disk usage: ${disk
									.map((d, idx) => `(Disk${idx}: ${(d.usage_percent * 100).toFixed(0)}%)`)
									.join(
										", "
									)} is above your threshold (${(diskThreshold * 100).toFixed(0)}%)`,
						};
						alertsToSend.push(formatAlert[type]());
					}
				}
			}

			await notification.save();

			if (alertsToSend.length === 0) continue; // No alerts to send, we're done

			if (notification.type === "email") {
				this.sendHardwareEmail(networkResponse, notification.address, alertsToSend);
			}
		}
		return true;
	}

	/**
	 * Handles notifications for different monitor types
	 *
	 * @async
	 * @function handleNotifications
	 * @param {Object} networkResponse - Response object containing monitor information
	 * @returns {Promise<boolean>} - Indicates whether notifications were processed successfully
	 */
	async handleNotifications(networkResponse) {
		try {
			if (networkResponse.monitor.type === "hardware") {
				this.handleHardwareNotifications(networkResponse);
			}
			this.handleStatusNotifications(networkResponse);
			return true;
		} catch (error) {
			this.logger.warn({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "handleNotifications",
				stack: error.stack,
			});
		}
	}
}

export default NotificationService;
