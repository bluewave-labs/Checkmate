import { createServerError } from "../utils/errorUtils.js";

const fetchMonitorCertificate = async (sslChecker, monitor) => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await sslChecker(hostname);
	// Throw an error if no cert or if cert.validTo is not present
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw createServerError("Certificate not found");
	}
	return cert;
};

export { fetchMonitorCertificate };
