// import PageSpeedCheck from "../../models/PageSpeedCheck.js";
const SERVICE_NAME = "pageSpeedCheckModule";

class PageSpeedCheckModule {
	constructor({ PageSpeedCheck }) {
		this.PageSpeedCheck = PageSpeedCheck;
	}

	createPageSpeedChecks = async (pageSpeedChecks) => {
		try {
			await this.PageSpeedCheck.insertMany(pageSpeedChecks, { ordered: false });
			return true;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createPageSpeedCheck";
			throw error;
		}
	};

	deletePageSpeedChecksByMonitorId = async (monitorId) => {
		try {
			const result = await this.PageSpeedCheck.deleteMany({ monitorId });
			return result.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deletePageSpeedChecksByMonitorId";
			throw error;
		}
	};
}
export default PageSpeedCheckModule;
