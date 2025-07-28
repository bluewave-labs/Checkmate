import notificationConfig from "../utils/notificationConfig.js";

class NotificationUtils {
	constructor({ stringService, emailService, db, settingsService }) {
		this.stringService = stringService;
		this.emailService = emailService;
		this.db = db;
		this.settingsService = settingsService;
		// Cache for app settings
		this.appSettings = null;
	}

	buildTestEmail = async () => {
		const context = { testName: "Monitoring System" };
		const html = await this.emailService.buildEmail("testEmailTemplate", context);
		return html;
	};

	buildStatusEmail = async (networkResponse) => {
		const { monitor, status, prevStatus } = networkResponse;
		const template = prevStatus === false ? "serverIsUpTemplate" : "serverIsDownTemplate";
		const context = { monitor: monitor.name, url: monitor.url };
		const subject = `Monitor ${monitor.name} is ${status === true ? "up" : "down"}`;
		const html = await this.emailService.buildEmail(template, context);
		return { subject, html };
	};

	buildWebhookMessage = (networkResponse) => {
		const { monitor, status, code, timestamp } = networkResponse;
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
		return messageText;
	};

	buildHardwareAlerts = async (networkResponse) => {
		const monitor = networkResponse?.monitor;
		const thresholds = networkResponse?.monitor?.thresholds;
		const {
			usage_cpu: cpuThreshold = -1,
			usage_memory: memoryThreshold = -1,
			usage_disk: diskThreshold = -1,
		} = thresholds;

		const metrics = networkResponse?.payload?.data;
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

		const alertsToSend = [];
		const alertTypes = ["cpu", "memory", "disk"];
		for (const type of alertTypes) {
			// Iterate over each alert type to see if any need to be decremented
			if (alerts[type] === true) {
				monitor[`${type}AlertThreshold`]--; // Decrement threshold if an alert is triggered

				if (monitor[`${type}AlertThreshold`] <= 0) {
					// If threshold drops below 0, reset and send notification
					monitor[`${type}AlertThreshold`] = monitor.alertThreshold;

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
		await monitor.save();
		return alertsToSend;
	};

	buildHardwareEmail = async (networkResponse, alerts) => {
		const { monitor } = networkResponse;
		const template = "hardwareIncidentTemplate";
		const context = { monitor: monitor.name, url: monitor.url, alerts };
		const subject = `Monitor ${monitor.name} infrastructure alerts`;
		const html = await this.emailService.buildEmail(template, context);
		return { subject, html };
	};

	buildHardwareNotificationMessage = (alerts) => {
		return alerts.map((alert) => alert).join("\n");
	};

	/**
	 * Calculates the next backoff delay with jitter for exponential backoff strategy
	 *
	 * @param {Number} currentDelay - Current delay in milliseconds
	 * @param {Number} multiplier - Multiplier for exponential growth
	 * @param {Number} maxDelay - Maximum delay in milliseconds
	 * @param {Number} jitterFactor - Factor for randomness (0-1)
	 * @returns {Number} - Next delay in milliseconds
	 */
	/**
	 * Get backoff settings from AppSettings or fallback to notificationConfig
	 * @returns {Object} Backoff settings
	 */
	getBackoffSettings = async () => {
		if (!this.appSettings) {
			try {
				// Get settings from database
				this.appSettings = await this.settingsService.getDBSettings();
			} catch {
				// Fallback to default config if settings service fails
				return {
					backoffEnabled: notificationConfig.BACKOFF_ENABLED_DEFAULT,
					initialBackoffDelay: notificationConfig.INITIAL_BACKOFF_DELAY_MS,
					maxBackoffDelay: notificationConfig.MAX_BACKOFF_DELAY_MS,
					backoffMultiplier: notificationConfig.BACKOFF_MULTIPLIER,
					backoffJitterFactor: notificationConfig.JITTER_FACTOR,
				};
			}
		}

		return {
			backoffEnabled:
				this.appSettings.backoffEnabled ?? notificationConfig.BACKOFF_ENABLED_DEFAULT,
			initialBackoffDelay:
				this.appSettings.initialBackoffDelay ??
				notificationConfig.INITIAL_BACKOFF_DELAY_MS,
			maxBackoffDelay:
				this.appSettings.maxBackoffDelay ?? notificationConfig.MAX_BACKOFF_DELAY_MS,
			backoffMultiplier:
				this.appSettings.backoffMultiplier ?? notificationConfig.BACKOFF_MULTIPLIER,
			backoffJitterFactor:
				this.appSettings.backoffJitterFactor ?? notificationConfig.JITTER_FACTOR,
		};
	};

	calculateNextBackoffDelay = async (
		currentDelay,
		multiplier,
		maxDelay,
		jitterFactor = null
	) => {
		// If jitterFactor is not provided, get it from settings
		if (jitterFactor === null) {
			const settings = await this.getBackoffSettings();
			jitterFactor = settings.backoffJitterFactor;
		}
		// Calculate base delay with exponential growth
		let nextDelay = currentDelay * multiplier;

		// Apply maximum limit
		nextDelay = Math.min(nextDelay, maxDelay);

		// Apply jitter (random factor to prevent thundering herd)
		const jitterRange = nextDelay * jitterFactor;
		// Ensure delay never goes negative
		const minDelay = Math.max(0, nextDelay - jitterRange / 2);
		nextDelay = minDelay + Math.random() * jitterRange;

		return Math.floor(nextDelay);
	};

	/**
	 * Determines if a notification should be sent based on monitor's backoff settings
	 *
	 * @param {Object} monitor - Monitor object with backoff settings
	 * @returns {Boolean} - Whether notification should be sent
	 */
	shouldSendNotification = async (monitor) => {
		// Get global settings
		const settings = await this.getBackoffSettings();

		// If backoff is disabled globally or for this monitor, always send
		if (!settings.backoffEnabled || !monitor.backoffEnabled) {
			return true;
		}

		// If no previous notification sent, always send
		if (!monitor.lastNotificationTime) {
			return true;
		}

		// Get current backoff delay (or use initial if not set)
		const currentDelay = monitor.currentBackoffDelay || monitor.initialBackoffDelay;

		// Check if enough time has passed since last notification
		const timeSinceLastNotification =
			Date.now() - new Date(monitor.lastNotificationTime).getTime();
		return timeSinceLastNotification >= currentDelay;
	};
}

export default NotificationUtils;
