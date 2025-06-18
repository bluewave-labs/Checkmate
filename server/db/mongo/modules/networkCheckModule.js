import NetworkCheck from "../../models/NetworkCheck.js";
import logger from "../../../utils/logger.js";

const SERVICE_NAME = "networkCheckModule";

const createNetworkCheck = async (networkCheckData) => {
	try {
		const { monitorId, status } = networkCheckData;
		const n = (await NetworkCheck.countDocuments({ monitorId })) + 1;

		const networkCheck = await new NetworkCheck({
			...networkCheckData,
			n,
		});

		await networkCheck.save();
		return networkCheck;
	} catch (error) {
		logger.error({
			message: error.message,
			service: SERVICE_NAME,
			method: "createNetworkCheck",
			stack: error.stack,
		});
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
		logger.error({
			message: error.message,
			service: SERVICE_NAME,
			method: "getNetworkChecksByMonitorId",
			stack: error.stack,
		});
		throw error;
	}
};

export { createNetworkCheck, getNetworkChecksByMonitorId };
