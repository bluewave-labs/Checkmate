import Notification from "../../models/Notification.js";
import Monitor from "../../models/Monitor.js";
const SERVICE_NAME = "notificationModule";
/**
 * Creates a new notification.
 * @param {Object} notificationData - The data for the new notification.
 * @param {mongoose.Types.ObjectId} notificationData.monitorId - The ID of the monitor.
 * @param {string} notificationData.type - The type of the notification (e.g., "email", "sms").
 * @param {string} [notificationData.address] - The address for the notification (if applicable).
 * @param {string} [notificationData.phone] - The phone number for the notification (if applicable).
 * @returns {Promise<Object>} The created notification.
 * @throws Will throw an error if the notification cannot be created.
 */
const createNotification = async (notificationData) => {
	try {
		const notification = await new Notification({ ...notificationData }).save();
		return notification;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createNotification";
		throw error;
	}
};

const getNotificationsByTeamId = async (teamId) => {
	try {
		const notifications = await Notification.find({ teamId });
		return notifications;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getNotificationsByTeamId";
		throw error;
	}
};

const getNotificationsByIds = async (notificationIds) => {
	try {
		const notifications = await Notification.find({ _id: { $in: notificationIds } });
		return notifications;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getNotificationsByIds";
		throw error;
	}
};

/**
 * Retrieves notifications by monitor ID.
 * @param {mongoose.Types.ObjectId} monitorId - The ID of the monitor.
 * @returns {Promise<Array<Object>>} An array of notifications.
 * @throws Will throw an error if the notifications cannot be retrieved.
 */
const getNotificationsByMonitorId = async (monitorId) => {
	try {
		const notifications = await Notification.find({ monitorId });
		return notifications;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getNotificationsByMonitorId";
		throw error;
	}
};

const deleteNotificationsByMonitorId = async (monitorId) => {
	try {
		const result = await Notification.deleteMany({ monitorId });
		return result.deletedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteNotificationsByMonitorId";
		throw error;
	}
};

const deleteNotificationById = async (id) => {
	try {
		const notification = await Notification.findById(id);
		if (!notification) {
			throw new Error("Notification not found");
		}

		const result = await Notification.findByIdAndDelete(id);
		await Monitor.updateMany({ notifications: id }, { $pull: { notifications: id } });
		return result;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteNotificationById";
		throw error;
	}
};

const getNotificationById = async (id) => {
	try {
		const notification = await Notification.findById(id);
		return notification;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getNotificationById";
		throw error;
	}
};

const editNotification = async (id, notificationData) => {
	try {
		const notification = await Notification.findByIdAndUpdate(id, notificationData, {
			new: true,
		});
		return notification;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "editNotification";
		throw error;
	}
};

export {
	createNotification,
	getNotificationsByTeamId,
	getNotificationsByIds,
	getNotificationsByMonitorId,
	deleteNotificationsByMonitorId,
	deleteNotificationById,
	getNotificationById,
	editNotification,
};
