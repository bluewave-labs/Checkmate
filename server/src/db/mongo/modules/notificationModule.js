// import Notification from "../../models/Notification.js";
// import Monitor from "../../models/Monitor.js";
const SERVICE_NAME = "notificationModule";

class NotificationModule {
	constructor({ Notification, Monitor }) {
		this.Notification = Notification;
		this.Monitor = Monitor;
	}
	createNotification = async (notificationData) => {
		try {
			const notification = await new this.Notification({ ...notificationData }).save();
			return notification;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "createNotification";
			throw error;
		}
	};
	getNotificationsByTeamId = async (teamId) => {
		try {
			const notifications = await this.Notification.find({ teamId });
			return notifications;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getNotificationsByTeamId";
			throw error;
		}
	};
	getNotificationsByIds = async (notificationIds) => {
		try {
			const notifications = await this.Notification.find({ _id: { $in: notificationIds } });
			return notifications;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getNotificationsByIds";
			throw error;
		}
	};
	getNotificationsByMonitorId = async (monitorId) => {
		try {
			const notifications = await this.Notification.find({ monitorId });
			return notifications;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getNotificationsByMonitorId";
			throw error;
		}
	};
	deleteNotificationsByMonitorId = async (monitorId) => {
		try {
			const result = await this.Notification.deleteMany({ monitorId });
			return result.deletedCount;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteNotificationsByMonitorId";
			throw error;
		}
	};
	deleteNotificationById = async (id) => {
		try {
			const notification = await this.Notification.findById(id);
			if (!notification) {
				throw new Error("Notification not found");
			}

			const result = await this.Notification.findByIdAndDelete(id);
			await this.Monitor.updateMany({ notifications: id }, { $pull: { notifications: id } });
			return result;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "deleteNotificationById";
			throw error;
		}
	};
	getNotificationById = async (id) => {
		try {
			const notification = await this.Notification.findById(id);
			return notification;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "getNotificationById";
			throw error;
		}
	};
	editNotification = async (id, notificationData) => {
		try {
			const notification = await this.Notification.findByIdAndUpdate(id, notificationData, {
				new: true,
			});
			return notification;
		} catch (error) {
			error.service = SERVICE_NAME;
			error.method = "editNotification";
			throw error;
		}
	};
}

export default NotificationModule;
