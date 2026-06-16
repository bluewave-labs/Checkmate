import { Monitor } from "@/domain/monitors/monitor.types.js";

type SSLDetails = {
	validTo: string | Date;
	daysRemaining?: number;
};

type SSLCheckerType = (hostname: string) => Promise<SSLDetails>;

export const fetchMonitorCertificate = async (checker: SSLCheckerType, monitor: Monitor): Promise<SSLDetails> => {
	if (!monitor.url) {
		throw new Error("Monitor URL not found");
	}

	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;

	const cert = await checker(hostname);

	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}

	return cert;
};

export const getCertificateDaysRemaining = (validTo: string | Date): number => {
	const expiryDate = new Date(validTo);

	if (Number.isNaN(expiryDate.getTime())) {
		throw new Error("Invalid certificate expiry date");
	}

	const msInDay = 1000 * 60 * 60 * 24;
	return Math.ceil((expiryDate.getTime() - Date.now()) / msInDay);
};
