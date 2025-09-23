const SERVICE_NAME = "maintenanceWindowModule";

class MaintenanceWindowModule {
	constructor({ MaintenanceWindow }) {
		this.MaintenanceWindow = MaintenanceWindow;
	}
	createMaintenanceWindow = async (maintenanceWindowData) => {
		try {
			const maintenanceWindow = new this.MaintenanceWindow({
				...maintenanceWindowData,
			});

			// If the maintenance window is a one time window, set the expiry to the end date
			if (maintenanceWindowData.oneTime) {
				maintenanceWindow.expiry = maintenanceWindowData.end;
			}
			const result = await maintenanceWindow.save();
			return result;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createMaintenanceWindow";
			throw error;
		}
	};
	getMaintenanceWindowById = async ({ id, teamId }) => {
		try {
			const maintenanceWindow = await this.MaintenanceWindow.findOne({
				_id: id,
				teamId: teamId,
			});
			return maintenanceWindow;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMaintenanceWindowById";
			throw error;
		}
	};

	getMaintenanceWindowsByTeamId = async (teamId, query) => {
		try {
			let { active, page, rowsPerPage, field, order } = query || {};
			const maintenanceQuery = { teamId };

			if (active !== undefined) maintenanceQuery.active = active;

			const maintenanceWindowCount = await this.MaintenanceWindow.countDocuments(maintenanceQuery);

			// Pagination
			let skip = 0;
			if (page && rowsPerPage) {
				skip = page * rowsPerPage;
			}

			// Sorting
			let sort = {};
			if (field !== undefined && order !== undefined) {
				sort[field] = order === "asc" ? 1 : -1;
			}

			const maintenanceWindows = await this.MaintenanceWindow.find(maintenanceQuery).skip(skip).limit(rowsPerPage).sort(sort);

			return { maintenanceWindows, maintenanceWindowCount };
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMaintenanceWindowByUserId";
			throw error;
		}
	};
	getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }) => {
		try {
			const maintenanceWindows = await this.MaintenanceWindow.find({
				monitorId: monitorId,
				teamId: teamId,
			});
			return maintenanceWindows;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getMaintenanceWindowsByMonitorId";
			throw error;
		}
	};

	deleteMaintenanceWindowById = async ({ id, teamId }) => {
		try {
			const maintenanceWindow = await this.MaintenanceWindow.findOneAndDelete({ _id: id, teamId });
			return maintenanceWindow;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteMaintenanceWindowById";
			throw error;
		}
	};

	editMaintenanceWindowById = async ({ id, body }) => {
		try {
			const editedMaintenanceWindow = await this.MaintenanceWindow.findByIdAndUpdate(id, body, { new: true });
			return editedMaintenanceWindow;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "editMaintenanceWindowById";
			throw error;
		}
	};
}

export default MaintenanceWindowModule;
