import { useState, useEffect, useCallback } from "react";
import { createToast } from "../Utils/toastUtils";
import { networkService } from "../main";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
	NOTIFICATION_TYPES,
	NTFY_AUTH_METHODS,
	NTFY_PRIORITIES,
} from "../Pages/Notifications/utils";

const useCreateNotification = () => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const createNotification = async (notification) => {
		try {
			setIsLoading(true);
			await networkService.createNotification({ notification });
			createToast({
				body: t("notifications.create.success"),
			});
			navigate("/notifications");
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.create.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [createNotification, isLoading, error];
};

const useGetNotificationsByTeamId = (updateTrigger) => {
	const [notifications, setNotifications] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const getNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getNotificationsByTeamId();
			setNotifications(response?.data?.data ?? []);
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.fetch.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	}, [t]);

	useEffect(() => {
		getNotifications();
	}, [getNotifications, updateTrigger]);

	return [notifications, isLoading, error];
};

const useDeleteNotification = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const deleteNotification = async (id, callback) => {
		try {
			setIsLoading(true);
			await networkService.deleteNotificationById({ id });
			createToast({
				body: t("notifications.delete.success"),
			});
			if (callback) {
				callback();
			}
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.delete.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [deleteNotification, isLoading, error];
};

const useGetNotificationById = (id, setNotification) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const getNotificationById = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await networkService.getNotificationById({ id });

			const notification = response?.data?.data ?? null;

			const notificationData = {
				address: notification?.address,
				notificationName: notification?.notificationName,
				type: NOTIFICATION_TYPES.find((type) => type.value === notification?.type)?._id,
				// ntfy-specific fields
				ntfyAuthMethod:
					NTFY_AUTH_METHODS.find(
						(method) => method.value === notification?.ntfyAuthMethod
					)?._id || NTFY_AUTH_METHODS[0]._id,
				ntfyUsername: notification?.ntfyUsername || "",
				ntfyPassword: notification?.ntfyPassword || "",
				ntfyBearerToken: notification?.ntfyBearerToken || "",
				ntfyPriority:
					NTFY_PRIORITIES.find(
						(priority) => priority.value === notification?.ntfyPriority
					)?._id || NTFY_PRIORITIES[2]._id,
			};

			setNotification(notificationData);
		} catch (error) {
			setError(error);
		} finally {
			setIsLoading(false);
		}
	}, [id, setNotification]);

	useEffect(() => {
		if (id) {
			getNotificationById();
		}
	}, [getNotificationById, id]);

	return [isLoading, error];
};

const useEditNotification = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const editNotification = async (id, notification) => {
		try {
			setIsLoading(true);
			await networkService.editNotification({ id, notification });
			createToast({
				body: t("notifications.edit.success"),
			});
			navigate(`/notifications`);
		} catch (error) {
			setError(error);
			createToast({
				body: t("notifications.edit.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [editNotification, isLoading, error];
};

const useTestNotification = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const { t } = useTranslation();

	const testNotification = async (notification) => {
		try {
			setIsLoading(true);
			await networkService.testNotification({ notification });
			createToast({
				body: t("notifications.test.success"),
			});
		} catch (error) {
			setError(error);
			createToast({
				body: error?.response?.data?.msg || t("notifications.test.failed"),
			});
		} finally {
			setIsLoading(false);
		}
	};

	return [testNotification, isLoading, error];
};

const useTestAllNotifications = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(undefined);
	const { t } = useTranslation();
	const testAllNotifications = async ({ monitorId }) => {
		try {
			setIsLoading(true);
			await networkService.testAllNotifications({ monitorId });
			createToast({
				body: t("notifications.test.success"),
			});
		} catch (error) {
			createToast({
				body: error.response?.data?.msg || error.message,
			});
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return [testAllNotifications, isLoading, error];
};

export {
	useCreateNotification,
	useGetNotificationsByTeamId,
	useDeleteNotification,
	useGetNotificationById,
	useEditNotification,
	useTestNotification,
	useTestAllNotifications,
};
