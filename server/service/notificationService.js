const SERVICE_NAME = "NotificationService";
const TELEGRAM_API_BASE_URL = "https://api.telegram.org/bot";
const PLATFORM_TYPES = ["telegram", "slack", "discord", "webhook"];

const MESSAGE_FORMATTERS = {
	telegram: (messageText, chatId) => ({ chat_id: chatId, text: messageText }),
	slack: (messageText) => ({ text: messageText }),
	discord: (messageText) => ({ content: messageText }),
	webhook: (messageText) => ({ text: messageText }),
};

class NotificationService {
	static SERVICE_NAME = SERVICE_NAME;
	/**
	 * Creates an instance of NotificationService.
	 *
	 * @param {Object} emailService - The email service used for sending notifications.
	 * @param {Object} db - The database instance for storing notification data.
	 * @param {Object} logger - The logger instance for logging activities.
	 * @param {Object} networkService - The network service for sending webhook notifications.
	 */
	constructor(emailService, db, logger, networkService, stringService) {
		this.SERVICE_NAME = SERVICE_NAME;
		this.emailService = emailService;
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.stringService = stringService;
	}

	/**
	 * Formats a notification message based on the monitor status and platform.
	 *
	 * @param {Object} monitor - The monitor object.
	 * @param {string} monitor.name - The name of the monitor.
	 * @param {string} monitor.url - The URL of the monitor.
	 * @param {boolean} status - The current status of the monitor (true for up, false for down).
	 * @param {string} platform - The notification platform (e.g., "telegram", "slack", "discord").
	 * @param {string} [chatId] - The chat ID for platforms that require it (e.g., Telegram).
	 * @returns {Object|null} The formatted message object for the specified platform, or null if the platform is unsupported.
	 */

	formatNotificationMessage(monitor, status, platform, chatId, code, timestamp) {
		// Format timestamp using the local system timezone
		const formatTime = (timestamp) => {
			const date = new Date(timestamp);

			// Get timezone abbreviation and format the date
			const timeZoneAbbr = date
				.toLocaleTimeString("en-US", { timeZoneName: "short" })
				.split(" ")
				.pop();

			// Format the date with readable format
			return (
				date
					.toLocaleString("en-US", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						hour12: false,
					})
					.replace(/(\d+)\/(\d+)\/(\d+),\s/, "$3-$1-$2 ") +
				" " +
				timeZoneAbbr
			);
		};

		// Get formatted time
		const formattedTime = timestamp
			? formatTime(timestamp)
			: formatTime(new Date().getTime());

		// Create different messages based on status with extra spacing
		let messageText;
		if (status === true) {
			messageText = this.stringService.monitorUpAlert
				.replace("{monitorName}", monitor.name)
				.replace("{time}", formattedTime)
				.replace("{code}", code || "Unknown");
		} else {
			messageText = this.stringService.monitorDownAlert
				.replace("{monitorName}", monitor.name)
				.replace("{time}", formattedTime)
				.replace("{code}", code || "Unknown");
		}

		if (!PLATFORM_TYPES.includes(platform)) {
			return undefined;
		}

		return MESSAGE_FORMATTERS[platform](messageText, chatId);
	}

	/**
	 * Sends a webhook notification to a specified platform.
	 *
	 * @param {Object} networkResponse - The response object from the network.
	 * @param {Object} networkResponse.monitor - The monitor object.
	 * @param {boolean} networkResponse.status - The monitor's status (true for up, false for down).
	 * @param {Object} notification - The notification settings.
	 * @param {string} notification.platform - The target platform ("telegram", "slack", "discord").
	 * @param {Object} notification.config - The configuration object for the webhook.
	 * @param {string} notification.config.webhookUrl - The webhook URL for the platform.
	 * @param {string} [notification.config.botToken] - The bot token for Telegram notifications.
	 * @param {string} [notification.config.chatId] - The chat ID for Telegram notifications.
	 * @returns {Promise<boolean>} A promise that resolves to true if the notification was sent successfully, otherwise false.
	 */

	async sendWebhookNotification(networkResponse, notification) {
		const { monitor, status, code } = networkResponse;
		const { platform } = notification;
		const { webhookUrl, botToken, chatId } = notification.config;

		// Early return if platform is not supported
		if (!PLATFORM_TYPES.includes(platform)) {
			this.logger.warn({
				message: this.stringService.getWebhookUnsupportedPlatform(platform),
				service: this.SERVICE_NAME,
				method: "sendWebhookNotification",
				details: { platform },
			});
			return false;
		}

		// Early return for telegram if required fields are missing
		if (platform === "telegram" && (!botToken || !chatId)) {
			this.logger.warn({
				message: "Missing required fields for Telegram notification",
				service: this.SERVICE_NAME,
				method: "sendWebhookNotification",
				details: { platform },
			});
			return false;
		}

		let url = webhookUrl;
		if (platform === "telegram") {
			url = `${TELEGRAM_API_BASE_URL}${botToken}/sendMessage`;
		}

		const message = this.formatNotificationMessage(
			monitor,
			status,
			platform,
			chatId,
			code, // Pass the code field directly
			networkResponse.timestamp
		);

		try {
			const response = await this.networkService.requestWebhook(platform, url, message);
			return response.status;
		} catch (error) {
			this.logger.error({
				message: this.stringService.getWebhookSendError(platform),
				service: this.SERVICE_NAME,
				method: "sendWebhookNotification",
				stack: error.stack,
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
			// If status hasn't changed, we're done
			if (networkResponse.statusChanged === false) return false;
			// if prevStatus is undefined, monitor is resuming, we're done
			if (networkResponse.prevStatus === undefined) return false;

			const notifications = await this.db.getNotificationsByMonitorId(
				networkResponse.monitorId
			);

			for (const notification of notifications) {
				if (notification.type === "email") {
					await this.sendEmail(networkResponse, notification.address);
				} else if (notification.type === "webhook") {
					await this.sendWebhookNotification(networkResponse, notification);
				}
				// Handle other types of notifications here
			}
			return true;
		} catch (error) {
			this.logger.error({
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
			disk:
				disk?.some(
					(d) =>
						diskThreshold !== -1 &&
						typeof d?.usage_percent === "number" &&
						d?.usage_percent > diskThreshold
				) ?? false,
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
			this.logger.error({
				message: error.message,
				service: this.SERVICE_NAME,
				method: "handleNotifications",
				stack: error.stack,
			});
		}
	}
}

export default NotificationService;
