const SERVICE_NAME = "networkCheckModule";

class NetworkCheckModule {
	constructor({ NetworkCheck }) {
		this.NetworkCheck = NetworkCheck;
	}
	createNetworkCheck = async (networkCheckData) => {
		try {
			const networkCheck = await new this.NetworkCheck(networkCheckData);
			await networkCheck.save();
			return networkCheck;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createNetworkCheck";
			throw error;
		}
	};
	getNetworkChecksByMonitorId = async (monitorId, limit = 100) => {
		try {
			const networkChecks = await this.NetworkCheck.find({ monitorId }).sort({ createdAt: -1 }).limit(limit);
			return networkChecks;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getNetworkChecksByMonitorId";
			throw error;
		}
	};
}

export default NetworkCheckModule;
