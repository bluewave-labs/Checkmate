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
	// Thresholds are stored as percentages (0-100), convert to decimal (0-1) for comparison
	const cpuThreshold = monitor.cpuAlertThreshold !== undefined ? monitor.cpuAlertThreshold / 100 : -1;
	const memoryThreshold = monitor.memoryAlertThreshold !== undefined ? monitor.memoryAlertThreshold / 100 : -1;
	const diskThreshold = monitor.diskAlertThreshold !== undefined ? monitor.diskAlertThreshold / 100 : -1;
	const tempThreshold = monitor.tempAlertThreshold !== undefined ? monitor.tempAlertThreshold : -1;

	const payload = networkResponse?.payload as HardwareStatusPayload;
	const metrics = payload.data || {};
	const { cpu = {}, memory = {}, disk = [] } = metrics;
	const cpuUsage = cpu.usage_percent ?? -1;
	const memoryUsage = memory.usage_percent ?? -1;
	// Get max temperature from CPU temperature sensors array
	const temps = cpu.temperature ?? [];
	const maxTemp = temps.length > 0 ? Math.max(...temps) : -1;

	const alerts: Record<string, boolean> = {
		cpu: cpuThreshold !== -1 && cpuUsage > cpuThreshold ? true : false,
		memory: memoryThreshold !== -1 && memoryUsage > memoryThreshold ? true : false,
		disk: disk?.some((d) => diskThreshold !== -1 && typeof d?.usage_percent === "number" && d?.usage_percent > diskThreshold) ?? false,
		temp: tempThreshold !== -1 && maxTemp > tempThreshold ? true : false,
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

		temp: () => ({
			title: "Temperature alert",
			description: `Your current temperature (${maxTemp.toFixed(0)}°C) is above your threshold (${tempThreshold.toFixed(0)}°C)`,
			color: 15548997,
			fields: [...monitorInfoFields, goToIncidentField],
			footer: { text: "Checkmate" },
		}),
	};

	const alertTypes = ["cpu", "memory", "disk", "temp"] as const;

	for (const type of alertTypes) {
		if (alerts[type] === true) {
			const formatAlert = {
				cpu: () => `Your current CPU usage (${(cpuUsage * 100).toFixed(0)}%) is above your threshold (${(cpuThreshold * 100).toFixed(0)}%)`,
				memory: () =>
					`Your current memory usage (${(memoryUsage * 100).toFixed(0)}%) is above your threshold (${(memoryThreshold * 100).toFixed(0)}%)`,
				disk: () =>
					`Your current disk usage: ${disk.map((d, idx) => `(Disk${idx}: ${(d?.usage_percent ?? 0 * 100).toFixed(0)}%)`).join(", ")} is above your threshold (${(diskThreshold * 100).toFixed(0)}%)`,
				temp: () => `Your current temperature (${maxTemp.toFixed(0)}°C) is above your threshold (${tempThreshold.toFixed(0)}°C)`,
			};
			alertsToSend.push(formatAlert[type]());
			discordEmbeds.push(formatDiscordAlert[type]());
		}
	}

	const discordPayload = discordEmbeds.length ? { embeds: discordEmbeds } : null;
	return { alertsToSend, discordPayload };
};

export const buildHardwareNotificationMessage = (clientHost: string, alerts: string[], monitor: Monitor): string => {
	const alertsHeader = [`Monitor: ${monitor.name}`, `URL: ${monitor.url}`];
	const alertFooter = [`Go to incident: ${clientHost}/infrastructure/${monitor.id}`];
	const alertText = alerts.length > 0 ? [...alertsHeader, ...alerts, ...alertFooter] : [];
	return alertText.join("\n");
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
	const template = monitor.status === "up" ? "serverIsUpTemplate" : "serverIsDownTemplate";
	const context = { monitor: monitor.name, url: monitor.url };
	const html = await emailService.buildEmail(template, context);
	return html;
};

export const buildDiscordBody = (monitor: Monitor, monitorStatusResponse: MonitorStatusResponse) => {
	const { localTime, utcTime } = getTime();
	let body = {
		embeds: [
			{
				title: `Monitor name: ${monitor.name}`,
				color: monitorStatusResponse.status ? 5763719 : 15548997,

				fields: [
					{ name: "Monitor", value: monitor.name, inline: false },
					{ name: "Status", value: monitorStatusResponse.status ? "Up" : "Down", inline: false },
					{ name: "Status Code", value: String(monitorStatusResponse.code), inline: false },
					{ name: "Time", value: `${localTime} (Local) / ${utcTime} (UTC)`, inline: false },
					{ name: "URL", value: monitor.url, inline: false },
				],
				footer: { text: "Checkmate" },
			},
		],
	};
	return body;
};

export const buildTestEmail = async (emailService: any) => {
	const context = { testName: "Monitoring System" };
	const html = await emailService.buildEmail("testEmailTemplate", context);
	return html;
};

export const getTestMessage = () => {
	return "This is a test notification from Checkmate";
};
