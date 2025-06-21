import NetworkCheck from "../../models/NetworkCheck.js";

const SERVICE_NAME = "networkCheckModule";

/**
 * Creates and saves a new network check document to the database.
 * @async
 * @param {object} networkCheckData - The data for the new network check. This should conform to the NetworkCheckSchema.
 * @param {string} networkCheckData.monitorId - The ID of the monitor associated with this check.
 * @returns {Promise<object>} A promise that resolves to the newly created network check document.
 * @throws {Error} Throws an error if the database operation fails.
 */
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

/**
 * Retrieves a list of network checks for a specific monitor, sorted by most recent.
 * @async
 * @param {string} monitorId - The ID of the monitor to retrieve checks for.
 * @param {number} [limit=100] - The maximum number of checks to return. Defaults to 100.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of network check documents.
 * @throws {Error} Throws an error if the database operation fails.
 */
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
