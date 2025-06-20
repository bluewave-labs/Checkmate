import NetworkCheck from "../../models/NetworkCheck.js";
import logger from "../../../utils/logger.js";

const SERVICE_NAME = "networkCheckModule";

const createNetworkCheck = async (networkCheckData) => {
	try {
		const networkCheck = await new NetworkCheck(networkCheckData);
		await networkCheck.save();
		return networkCheck;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createNetworkCheck";
		throw error;
	}
};

const getNetworkChecksByMonitorId = async (monitorId, limit = 100) => {
	try {
		const networkChecks = await NetworkCheck.find({ monitorId })
			.sort({ createdAt: -1 })
			.limit(limit);
		return networkChecks;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getNetworkChecksByMonitorId";
		throw error;
	}
};

export { createNetworkCheck, getNetworkChecksByMonitorId };
