const fetchMonitorCertificate = async (sslChecker: any, monitor: any): Promise<any> => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await sslChecker(hostname);
	// Throw an error if no cert or if cert.validTo is not present
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};

export { fetchMonitorCertificate };
