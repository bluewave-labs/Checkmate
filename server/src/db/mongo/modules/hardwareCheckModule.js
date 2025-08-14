const SERVICE_NAME = "hardwareCheckModule";

class HardwareCheckModule {
	constructor({ HardwareCheck, Monitor, logger }) {
		this.HardwareCheck = HardwareCheck;
		this.Monitor = Monitor;
		this.logger = logger;
	}

	createHardwareChecks = async (hardwareChecks) => {
		try {
			await this.HardwareCheck.insertMany(hardwareChecks, { ordered: false });
			return true;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createHardwareChecks";
			throw error;
		}
	};
}

export default HardwareCheckModule;
