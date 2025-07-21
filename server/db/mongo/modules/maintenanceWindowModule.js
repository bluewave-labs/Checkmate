import MaintenanceWindow from "../../models/MaintenanceWindow.js";
const SERVICE_NAME = "maintenanceWindowModule";

/**
 * Asynchronously creates a new MaintenanceWindow document and saves it to the database.
 * If the maintenance window is a one-time event, the expiry field is set to the same value as the end field.
 * @async
 * @function createMaintenanceWindow
 * @param {Object} maintenanceWindowData - The data for the new MaintenanceWindow document.
 * @param {mongoose.Schema.Types.ObjectId} maintenanceWindowData.monitorId - The ID of the monitor.
 * @param {Boolean} maintenanceWindowData.active - Indicates whether the maintenance window is active.
 * @param {Boolean} maintenanceWindowData.oneTime - Indicates whether the maintenance window is a one-time event.
 * @param {Date} maintenanceWindowData.start - The start date and time of the maintenance window.
 * @param {Date} maintenanceWindowData.end - The end date and time of the maintenance window.
 * @returns {Promise<MaintenanceWindow>} The saved MaintenanceWindow document.
 * @throws {Error} If there is an error saving the document.
 */
const createMaintenanceWindow = async (maintenanceWindowData) => {
	try {
		const maintenanceWindow = new MaintenanceWindow({
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

const getMaintenanceWindowById = async ({ id, teamId }) => {
	try {
		const maintenanceWindow = await MaintenanceWindow.findOne({
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

/**
 * Asynchronously retrieves all MaintenanceWindow documents associated with a specific team ID.
 * @async
 * @function getMaintenanceWindowByUserId
 * @param {String} teamId - The ID of the team.
 * @param {Object} query - The request body.
 * @returns {Promise<Array<MaintenanceWindow>>} An array of MaintenanceWindow documents.
 * @throws {Error} If there is an error retrieving the documents.
 */
const getMaintenanceWindowsByTeamId = async (teamId, query) => {
	try {
		let { active, page, rowsPerPage, field, order } = query || {};
		const maintenanceQuery = { teamId };

		if (active !== undefined) maintenanceQuery.active = active;

		const maintenanceWindowCount = await MaintenanceWindow.countDocuments(maintenanceQuery);

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

		const maintenanceWindows = await MaintenanceWindow.find(maintenanceQuery).skip(skip).limit(rowsPerPage).sort(sort);

		return { maintenanceWindows, maintenanceWindowCount };
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getMaintenanceWindowByUserId";
		throw error;
	}
};

/**
 * Asynchronously retrieves all MaintenanceWindow documents associated with a specific monitor ID.
 * @async
 * @function getMaintenanceWindowsByMonitorId
 * @param {mongoose.Schema.Types.ObjectId} monitorId - The ID of the monitor.
 * @returns {Promise<Array<MaintenanceWindow>>} An array of MaintenanceWindow documents.
 * @throws {Error} If there is an error retrieving the documents.
 */
const getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }) => {
	try {
		const maintenanceWindows = await MaintenanceWindow.find({
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

/**
 * Asynchronously deletes a MaintenanceWindow document by its ID.
 * @async
 * @function deleteMaintenanceWindowById
 * @param {mongoose.Schema.Types.ObjectId} maintenanceWindowId - The ID of the MaintenanceWindow document to delete.
 * @returns {Promise<MaintenanceWindow>} The deleted MaintenanceWindow document.
 * @throws {Error} If there is an error deleting the document.
 */
const deleteMaintenanceWindowById = async ({ id, teamId }) => {
	try {
		const maintenanceWindow = await MaintenanceWindow.findOneAndDelete({ _id: id, teamId });
		return maintenanceWindow;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteMaintenanceWindowById";
		throw error;
	}
};

/**
 * Asynchronously deletes all MaintenanceWindow documents associated with a specific monitor ID.
 * @async
 * @function deleteMaintenanceWindowByMonitorId
 * @param {mongoose.Schema.Types.ObjectId} monitorId - The ID of the monitor.
 * @returns {Promise<Object>} The result of the delete operation. This object contains information about the operation, such as the number of documents deleted.
 * @throws {Error} If there is an error deleting the documents.
 * @example
 */
const deleteMaintenanceWindowByMonitorId = async (monitorId) => {
	try {
		const result = await MaintenanceWindow.deleteMany({ monitorId: monitorId });
		return result;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteMaintenanceWindowByMonitorId";
		throw error;
	}
};

/**
 * Asynchronously deletes all MaintenanceWindow documents associated with a specific user ID.
 * @async
 * @function deleteMaintenanceWindowByUserId
 * @param {String} userId - The ID of the user.
 * @returns {Promise<Object>} The result of the delete operation. This object contains information about the operation, such as the number of documents deleted.
 * @throws {Error} If there is an error deleting the documents.
 * @example
 */
const deleteMaintenanceWindowByUserId = async (userId) => {
	try {
		const result = await MaintenanceWindow.deleteMany({ userId: userId });
		return result;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteMaintenanceWindowByUserId";
		throw error;
	}
};

const editMaintenanceWindowById = async ({ id, body, teamId }) => {
	try {
		const editedMaintenanceWindow = await MaintenanceWindow.findByIdAndUpdate(id, body, { new: true });
		return editedMaintenanceWindow;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "editMaintenanceWindowById";
		throw error;
	}
};

export {
	createMaintenanceWindow,
	getMaintenanceWindowById,
	getMaintenanceWindowsByTeamId,
	getMaintenanceWindowsByMonitorId,
	deleteMaintenanceWindowById,
	deleteMaintenanceWindowByMonitorId,
	deleteMaintenanceWindowByUserId,
	editMaintenanceWindowById,
};
