const handleValidationError = (error, serviceName) => {
	error.status = 422;
	error.service = serviceName;
	error.message = error.details?.[0]?.message || error.message || "Validation Error";
	return error;
};

const handleError = (error, serviceName, method, status = 500) => {
	error.status === undefined ? (error.status = status) : null;
	error.service === undefined ? (error.service = serviceName) : null;
	error.method === undefined ? (error.method = method) : null;
	return error;
};

const fetchMonitorCertificate = async (sslChecker, monitor) => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await sslChecker(hostname);
	// Throw an error if no cert or if cert.validTo is not present
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};

export { handleValidationError, handleError, fetchMonitorCertificate };
