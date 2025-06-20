class NotificationUtils {
	constructor({ stringService, emailService }) {
		this.stringService = stringService;
		this.emailService = emailService;
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
}

export default NotificationUtils;
