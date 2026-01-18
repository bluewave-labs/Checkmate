import { Monitor, HardwareStatusPayload, MonitorStatusResponse } from "@/types/index.js";

const buildHardwareAlerts = async (clientHost: string, monitor: Monitor, networkResponse: MonitorStatusResponse) => {
	const thresholds = monitor.thresholds || {};
	const { usage_cpu: cpuThreshold = -1, usage_memory: memoryThreshold = -1, usage_disk: diskThreshold = -1 } = thresholds;

	const payload = networkResponse?.payload as HardwareStatusPayload;
	const metrics = payload.data || {};
	const { cpu: { usage_percent: cpuUsage = -1 } = {}, memory: { usage_percent: memoryUsage = -1 } = {}, disk = [] } = metrics;

	const alerts = {
		cpu: cpuThreshold !== -1 && cpuUsage > cpuThreshold ? true : false,
		memory: memoryThreshold !== -1 && memoryUsage > memoryThreshold ? true : false,
		disk: disk?.some((d) => diskThreshold !== -1 && typeof d?.usage_percent === "number" && d?.usage_percent > diskThreshold) ?? false,
	};

	const alertsToSend = [];
	const discordEmbeds = [];
	const monitorInfoFields = [
		{ name: "Monitor", value: monitor.name, inline: true },
		{ name: "URL", value: monitor.url, inline: false },
	];
	const goToIncidentField = { name: `Go to incident`, value: `${clientHost}/infrastructure/${monitor.id}` };
	const formatDiscordAlert = {
		cpu: () => ({
			title: "CPU alert",
			description: `Your current CPU usage (${(cpuUsage * 100).toFixed(0)}%) is above your threshold (${(cpuThreshold * 100).toFixed(0)}%)`,
			color: 15548997,
			fields: [...monitorInfoFields, goToIncidentField],
			footer: { text: "Checkmate" },
		}),

		memory: () => ({
			title: "Memory alert",
			description: `Your current memory usage (${(memoryUsage * 100).toFixed(0)}%) is above your threshold (${(memoryThreshold * 100).toFixed(0)}%)`,
			color: 15548997,
			fields: [...monitorInfoFields, goToIncidentField],
			footer: { text: "Checkmate" },
		}),

		disk: () => ({
			title: "Disk alert",
			description: `Your current disk usage is above your threshold (${(diskThreshold * 100).toFixed(0)}%)`,
			color: 15548997,
			footer: { text: "Checkmate" },
			fields: [
				...monitorInfoFields,
				...(Array.isArray(disk) ? disk : []).map((d: any, idx: number) => ({
					name: `Disk ${idx}`,
					value: `${(d?.usage_percent * 100).toFixed(0)}%`,
					inline: true,
				})),
				goToIncidentField,
			],
		}),
	};
	const alertTypes = ["cpu", "memory", "disk"];
	for (const type of alertTypes) {
		// Iterate over each alert type to see if any need to be decremented
		if (alerts[type] === true) {
			monitor[`${type}AlertThreshold`]--; // Decrement threshold if an alert is triggered

			if (monitor[`${type}AlertThreshold`] <= 0) {
				// If threshold drops below 0, reset and send notification
				monitor[`${type}AlertThreshold`] = monitor.alertThreshold;

				const formatAlert = {
					cpu: () => `Your current CPU usage (${(cpuUsage * 100).toFixed(0)}%) is above your threshold (${(cpuThreshold * 100).toFixed(0)}%)`,
					memory: () =>
						`Your current memory usage (${(memoryUsage * 100).toFixed(0)}%) is above your threshold (${(memoryThreshold * 100).toFixed(0)}%)`,
					disk: () =>
						`Your current disk usage: ${disk
							.map((d, idx) => `(Disk${idx}: ${(d.usage_percent * 100).toFixed(0)}%)`)
							.join(", ")} is above your threshold (${(diskThreshold * 100).toFixed(0)}%)`,
				};
				alertsToSend.push(formatAlert[type]());
				discordEmbeds.push(formatDiscordAlert[type]());
			}
		}
	}
	const discordPayload = discordEmbeds.length ? { embeds: discordEmbeds } : null;
	return [alertsToSend, discordPayload];
};

const buildHardwareNotificationMessage = (alerts: any, monitor: Monitor) => {
	const { clientHost } = this.settingsService.getSettings();
	const alertsHeader = [`Monitor: ${monitor.name}`, `URL: ${monitor.url}`];
	const alertFooter = [`Go to incident: ${clientHost}/infrastructure/${monitor._id}`];
	const alertText = alerts.length > 0 ? [...alertsHeader, ...alerts, ...alertFooter] : [];
	return alertText.map((alert) => alert).join("\n");
};
