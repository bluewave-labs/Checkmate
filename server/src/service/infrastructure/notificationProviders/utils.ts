import { Monitor, HardwareStatusPayload, MonitorStatusResponse } from "@/types/index.js";

const getTime = (): { localTimeZone: string; localTime: string; utcTime: string } => {
	const now = new Date();
	const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const localTime = new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
		timeZone: localTimeZone,
		timeZoneName: "short",
	}).format(now);
	const utcTime = now.toUTCString();
	return { localTimeZone, localTime, utcTime };
};

export const buildHardwareAlerts = (
	clientHost: string,
	monitor: Monitor,
	networkResponse: MonitorStatusResponse
): { alertsToSend: string[]; discordPayload: any } => {
	const thresholds = monitor.thresholds || {};
	const { usage_cpu: cpuThreshold = -1, usage_memory: memoryThreshold = -1, usage_disk: diskThreshold = -1 } = thresholds;

	const payload = networkResponse?.payload as HardwareStatusPayload;
	const metrics = payload.data || {};
	const { cpu: { usage_percent: cpuUsage = -1 } = {}, memory: { usage_percent: memoryUsage = -1 } = {}, disk = [] } = metrics;

	const alerts: Record<string, boolean> = {
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
	const alertTypes = ["cpu", "memory", "disk"] as const;
	const alertThresholdKeyMap: Record<(typeof alertTypes)[number], "cpuAlertThreshold" | "memoryAlertThreshold" | "diskAlertThreshold"> = {
		cpu: "cpuAlertThreshold",
		memory: "memoryAlertThreshold",
		disk: "diskAlertThreshold",
	};
	for (const type of alertTypes) {
		const thresholdKey = alertThresholdKeyMap[type];
		// Iterate over each alert type to see if any need to be decremented
		if (alerts[type] === true) {
			const nextValue = ((monitor[thresholdKey] ?? monitor.alertThreshold) as number) - 1;
			monitor[thresholdKey] = nextValue; // Decrement threshold if an alert is triggered

			if (monitor[thresholdKey] <= 0) {
				// If threshold drops below 0, reset and send notification
				monitor[thresholdKey] = monitor.alertThreshold;

				const formatAlert = {
					cpu: () => `Your current CPU usage (${(cpuUsage * 100).toFixed(0)}%) is above your threshold (${(cpuThreshold * 100).toFixed(0)}%)`,
					memory: () =>
						`Your current memory usage (${(memoryUsage * 100).toFixed(0)}%) is above your threshold (${(memoryThreshold * 100).toFixed(0)}%)`,
					disk: () =>
						`Your current disk usage: ${disk
							.map((d, idx) => `(Disk${idx}: ${(d?.usage_percent ?? 0 * 100).toFixed(0)}%)`)
							.join(", ")} is above your threshold (${(diskThreshold * 100).toFixed(0)}%)`,
				};
				alertsToSend.push(formatAlert[type]());
				discordEmbeds.push(formatDiscordAlert[type]());
			}
		}
	}
	const discordPayload = discordEmbeds.length ? { embeds: discordEmbeds } : null;
	return { alertsToSend, discordPayload };
};

export const buildHardwareNotificationMessage = (clientHost: string, alerts: any, monitor: Monitor) => {
	const alertsHeader = [`Monitor: ${monitor.name}`, `URL: ${monitor.url}`];
	const alertFooter = [`Go to incident: ${clientHost}/infrastructure/${monitor.id}`];
	const alertText = alerts.length > 0 ? [...alertsHeader, ...alerts, ...alertFooter] : [];
	return alertText.map((alert) => alert).join("\n");
};

export const buildHardwareWebhookBody = (alerts: string[], monitor: Monitor): { text: string; name: string; url: string } => {
	const content = alerts.map((alert) => alert).join("\n");
	const body = { text: content, name: monitor.name, url: monitor.url };
	return body;
};

export const shouldSendHardwareAlert = (monitor: Monitor, networkResponse: MonitorStatusResponse): boolean => {
	const thresholds = monitor.thresholds || {};
	const { usage_cpu: cpuThreshold = -1, usage_memory: memoryThreshold = -1, usage_disk: diskThreshold = -1 } = thresholds;

	const payload = networkResponse?.payload as HardwareStatusPayload;
	const metrics = payload.data || {};
	const { cpu: { usage_percent: cpuUsage = -1 } = {}, memory: { usage_percent: memoryUsage = -1 } = {}, disk = [] } = metrics;

	const cpuBreach = cpuThreshold !== -1 && cpuUsage > cpuThreshold;
	if (cpuBreach && ((monitor.cpuAlertThreshold ?? monitor.alertThreshold) as number) - 1 <= 0) {
		return true;
	}

	const memoryBreach = memoryThreshold !== -1 && memoryUsage > memoryThreshold;
	if (memoryBreach && ((monitor.memoryAlertThreshold ?? monitor.alertThreshold) as number) - 1 <= 0) {
		return true;
	}

	const diskBreach = disk?.some((d) => diskThreshold !== -1 && typeof d?.usage_percent === "number" && d?.usage_percent > diskThreshold);
	if (diskBreach && ((monitor.diskAlertThreshold ?? monitor.alertThreshold) as number) - 1 <= 0) {
		return true;
	}

	return false;
};

export const buildWebhookBody = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
	const { status, code } = monitorStatusResponse;
	const { localTimeZone, localTime, utcTime } = getTime();
	return `Monitor: ${monitor.name}\nLocal Time (${localTimeZone}): ${localTime}\nUTC Time: ${utcTime}\nStatus: ${status ? "UP" : "DOWN"}\nStatus Code: ${code}\n\u200B\n`;
};

export const buildHardwareEmail = async (emailService: any, monitor: Monitor, alerts: string[]) => {
	const template = "hardwareIncidentTemplate";
	const context = { monitor: monitor.name, url: monitor.url, alerts };
	const html = await emailService.buildEmail(template, context);
	return html;
};

export const buildEmail = async (emailService: any, monitor: Monitor): Promise<string> => {
	const template = monitor.status === false ? "serverIsUpTemplate" : "serverIsDownTemplate";
	const context = { monitor: monitor.name, url: monitor.url };
	const html = await emailService.buildEmail(template, context);
	console.log({ html: typeof html });
	return html;
};

export const buildDiscordBody = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
	const { localTime, utcTime } = getTime();
	let body = {
		embeds: [
			{
				title: `Monitor ${monitor.name}`,
				color: monitor.status ? 5763719 : 15548997,

				fields: [
					{ name: "Monitor", value: monitor.name, inline: true },
					{ name: "Status", value: monitor.status ? "Up" : "Down", inline: true },
					{ name: "Status Code", value: String(monitorStatusResponse.code), inline: true },
					{ name: "Time", value: `${localTime} (Local) / ${utcTime} (UTC)`, inline: true },
					{ name: "URL", value: monitor.url, inline: false },
				],
				footer: { text: "Checkmate" },
			},
		],
	};
	return body;
};
